/**
 * NeuroFlow — useSpeech
 * Encapsula a Web Speech API (text-to-speech + speech-to-text) com fallback
 * seguro para ambientes sem suporte (SSR, navegadores antigos, permissão
 * negada). Sempre degrada para modo silencioso/digitação, sem travar a UI.
 *
 * Nenhum dos recursos aqui exige instalação de pacotes — tudo é nativo do
 * navegador. O suporte é verificado em runtime.
 */
import { useCallback, useEffect, useRef, useState } from 'react'

// Tipos mínimos da Web Speech API (não estão no lib.dom padrão do TS).
interface SpeechRecognitionResultLike {
  0: { transcript: string }
  isFinal: boolean
}
interface SpeechRecognitionEventLike {
  resultIndex: number
  results: { length: number; [i: number]: SpeechRecognitionResultLike }
}
interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((e: SpeechRecognitionEventLike) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

function getSpeechSynthesis(): SpeechSynthesis | null {
  if (typeof window === 'undefined') return null
  return window.speechSynthesis ?? null
}

interface UseSpeechOptions {
  /** Idioma do reconhecimento e síntese (default pt-BR). */
  lang?: string
  /** Velocidade da fala (0.1 a 10, default 0.95 — mais lenta/acolhedora). */
  rate?: number
}

export interface UseSpeechResult {
  /** TTS disponível no navegador. */
  ttsSupported: boolean
  /** STT disponível no navegador. */
  sttSupported: boolean
  /** O sintetizador está falando agora. */
  speaking: boolean
  /** O reconhecedor está ouvindo agora. */
  listening: boolean
  /** Texto parcial reconhecido (interim). */
  interimTranscript: string
  /** Último erro ocorrido (string legível, exibida no rodapé). */
  error: string | null
  /** Lê um texto em voz alta (TTS). No-op se não suportado. */
  speak: (text: string) => void
  /** Interrompe a fala atual. */
  cancelSpeak: () => void
  /** Inicia a escuta do microfone (STT). `onFinal` recebe o texto final. */
  startListening: (onFinal: (text: string) => void) => void
  /** Encerra a escuta. */
  stopListening: () => void
  /** Reseta o estado interno (transcripts/erros). */
  reset: () => void
}

export function useSpeech(options: UseSpeechOptions = {}): UseSpeechResult {
  const { lang = 'pt-BR', rate = 0.95 } = options

  const [ttsSupported, setTtsSupported] = useState(() => !!getSpeechSynthesis())
  const [sttSupported, setSttSupported] = useState(() => !!getSpeechRecognitionCtor())
  const [speaking, setSpeaking] = useState(false)
  const [listening, setListening] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const resumeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Atualiza vozes disponíveis
  const updateVoices = useCallback(() => {
    const synth = getSpeechSynthesis()
    if (!synth) return
    try {
      const loadedVoices = synth.getVoices() || []
      if (loadedVoices.length > 0) {
        setVoices(loadedVoices)
      }
    } catch {
      /* noop */
    }
  }, [])

  useEffect(() => {
    setTtsSupported(!!getSpeechSynthesis())
    setSttSupported(!!getSpeechRecognitionCtor())
    updateVoices()
  }, [updateVoices])

  // --- Text-to-speech --------------------------------------------------
  const speak = useCallback(
    (text: string) => {
      const synth = getSpeechSynthesis()
      if (!synth || !text || !text.trim()) return

      // Desbloqueia estado de pausa do navegador se travado
      try {
        if (synth.paused) {
          synth.resume()
        }
        synth.cancel()
      } catch {
        /* noop */
      }

      const cleanText = text
        .replace(/[*_#`[\]()]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      const utter = new SpeechSynthesisUtterance(cleanText)
      utter.lang = lang
      utter.rate = rate
      utter.pitch = 1
      utter.volume = 1

      // Tenta escolher uma voz pt-BR se disponível.
      const currentVoices = synth.getVoices()
      const list = currentVoices.length > 0 ? currentVoices : voices
      const ptVoice =
        list.find((v) => v.lang?.toLowerCase().replace('_', '-') === 'pt-br') ||
        list.find((v) => v.lang?.toLowerCase().startsWith('pt')) ||
        list[0]

      if (ptVoice) {
        utter.voice = ptVoice
      }

      utter.onstart = () => {
        setSpeaking(true)
        // Bugfix Chrome/Safari: síntese longa pode pausar após ~15 segundos.
        // Um timer resume() mantém a reprodução contínua.
        if (resumeIntervalRef.current) clearInterval(resumeIntervalRef.current)
        resumeIntervalRef.current = setInterval(() => {
          if (synth && synth.speaking && !synth.paused) {
            synth.pause()
            synth.resume()
          }
        }, 10000)
      }

      utter.onend = () => {
        setSpeaking(false)
        utteranceRef.current = null
        if (resumeIntervalRef.current) {
          clearInterval(resumeIntervalRef.current)
          resumeIntervalRef.current = null
        }
      }

      utter.onerror = (e) => {
        // 'interrupted' e 'canceled' são normais quando cancelSpeak() ou nova fala ocorre
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          console.warn('SpeechSynthesis error:', e.error)
        }
        setSpeaking(false)
        utteranceRef.current = null
        if (resumeIntervalRef.current) {
          clearInterval(resumeIntervalRef.current)
          resumeIntervalRef.current = null
        }
      }

      utteranceRef.current = utter

      // Timeout de 10ms para garantir que cancel() anterior seja processado
      setTimeout(() => {
        try {
          synth.speak(utter)
          // Força resume caso navegador tenha entrado em suspensão de áudio
          if (synth.paused) {
            synth.resume()
          }
        } catch (err) {
          console.warn('Falha ao acionar speak():', err)
          setSpeaking(false)
        }
      }, 10)
    },
    [lang, rate, voices],
  )

  const cancelSpeak = useCallback(() => {
    const synth = getSpeechSynthesis()
    if (synth) synth.cancel()
    setSpeaking(false)
  }, [])

  // --- Speech-to-text --------------------------------------------------
  const stopListening = useCallback(() => {
    const rec = recognitionRef.current
    if (rec) {
      try {
        rec.stop()
      } catch {
        /* noop */
      }
    }
    setListening(false)
  }, [])

  const startListening = useCallback(
    (onFinal: (text: string) => void) => {
      const Ctor = getSpeechRecognitionCtor()
      if (!Ctor) {
        setError('Reconhecimento de voz não suportado neste navegador. Use a digitação.')
        return
      }
      // Limpa instância anterior.
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch {
          /* noop */
        }
      }
      const rec = new Ctor()
      rec.lang = lang
      rec.continuous = false
      rec.interimResults = true

      rec.onresult = (event: SpeechRecognitionEventLike) => {
        let interim = ''
        let final = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i]
          const transcript = res[0]?.transcript ?? ''
          if (res.isFinal) final += transcript
          else interim += transcript
        }
        if (interim) setInterimTranscript(interim)
        if (final.trim()) {
          setInterimTranscript('')
          onFinal(final.trim())
        }
      }
      rec.onerror = () => {
        setError('Não foi possível capturar o áudio. Verifique a permissão do microfone.')
        setListening(false)
      }
      rec.onend = () => {
        setListening(false)
      }

      recognitionRef.current = rec
      setError(null)
      try {
        rec.start()
        setListening(true)
      } catch {
        // start() pode lançar se já estiver ativo — ignoramos com segurança.
        setListening(false)
      }
    },
    [lang],
  )

  const reset = useCallback(() => {
    setInterimTranscript('')
    setError(null)
  }, [])

  // Limpeza ao desmontar.
  useEffect(() => {
    return () => {
      if (resumeIntervalRef.current) {
        clearInterval(resumeIntervalRef.current)
        resumeIntervalRef.current = null
      }
      const synth = getSpeechSynthesis()
      if (synth) {
        try {
          synth.cancel()
        } catch {
          /* noop */
        }
      }
      const rec = recognitionRef.current
      if (rec) {
        try {
          rec.abort()
        } catch {
          /* noop */
        }
      }
    }
  }, [])

  // Carrega vozes (alguns navegadores só preenchem getVoices() após evento ou delay).
  useEffect(() => {
    const synth = getSpeechSynthesis()
    if (!synth) return
    updateVoices()
    const handler = () => {
      updateVoices()
    }
    if (typeof synth.addEventListener === 'function') {
      synth.addEventListener('voiceschanged', handler)
    } else if ('onvoiceschanged' in synth) {
      synth.onvoiceschanged = handler
    }
    return () => {
      if (typeof synth.removeEventListener === 'function') {
        synth.removeEventListener('voiceschanged', handler)
      } else if ('onvoiceschanged' in synth) {
        synth.onvoiceschanged = null
      }
    }
  }, [updateVoices])

  return {
    ttsSupported,
    sttSupported,
    speaking,
    listening,
    interimTranscript,
    error,
    speak,
    cancelSpeak,
    startListening,
    stopListening,
    reset,
  }
}
