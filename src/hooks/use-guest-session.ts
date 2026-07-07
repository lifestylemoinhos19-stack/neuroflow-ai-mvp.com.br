import { useState, useCallback, useEffect } from 'react'

const GUEST_TOKEN_KEY = 'neuroflow_guest_token'

function generateToken(): string {
  return `guest_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
}

export function useGuestSession() {
  const [guestToken, setGuestToken] = useState<string | null>(null)

  useEffect(() => {
    let token = localStorage.getItem(GUEST_TOKEN_KEY)
    if (!token) {
      token = generateToken()
      localStorage.setItem(GUEST_TOKEN_KEY, token)
    }
    setGuestToken(token)
  }, [])

  const isGuest = !localStorage.getItem('neuroflow_mfa_verified')

  const clearGuestSession = useCallback(() => {
    localStorage.removeItem(GUEST_TOKEN_KEY)
    setGuestToken(null)
  }, [])

  return { guestToken, isGuest, clearGuestSession }
}
