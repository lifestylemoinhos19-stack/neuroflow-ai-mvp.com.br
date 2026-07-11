export interface BrowserGuidance {
  name: string
  steps: string[]
}

export function getBrowserPermissionGuidance(): BrowserGuidance {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''

  if (/Edg/.test(ua)) {
    return {
      name: 'Microsoft Edge',
      steps: [
        'Clique no ícone de câmera na barra de endereço (à esquerda do URL)',
        'Altere a permissão de câmera para "Permitir"',
        'Recarregue a página e tente novamente',
      ],
    }
  }

  if (/OPR/.test(ua) || /Opera/.test(ua)) {
    return {
      name: 'Opera',
      steps: [
        'Clique no ícone de câmera na barra de endereço',
        'Selecione "Permitir" para o acesso à câmera',
        'Recarregue a página e tente novamente',
      ],
    }
  }

  if (/Chrome/.test(ua) && !/Edg/.test(ua) && !/OPR/.test(ua)) {
    return {
      name: 'Google Chrome',
      steps: [
        'Clique no ícone de câmera na barra de endereço (à esquerda do URL)',
        'Selecione "Sempre permitir" para o acesso à câmera neste site',
        'Recarregue a página e clique em "Iniciar Calibração" novamente',
      ],
    }
  }

  if (/Firefox/.test(ua)) {
    return {
      name: 'Mozilla Firefox',
      steps: [
        'Clique no ícone de câmera na barra de endereço',
        'Remova o bloqueio e selecione "Permitir" para a câmera',
        'Recarregue a página e tente novamente',
      ],
    }
  }

  if (/Safari/.test(ua) && !/Chrome/.test(ua)) {
    return {
      name: 'Safari',
      steps: [
        'Abra Safari > Preferências > Sites > Câmera',
        'Encontre este site e altere a permissão para "Permitir"',
        'Recarregue a página e tente novamente',
      ],
    }
  }

  return {
    name: 'seu navegador',
    steps: [
      'Abra as configurações de privacidade do seu navegador',
      'Localize as permissões de câmera para este site',
      'Altere para "Permitir" e recarregue a página',
    ],
  }
}
