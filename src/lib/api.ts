// Mock API Layer simulating FastAPI backend interactions
export const api = {
  auth: {
    login: async (email: string, password: string) => {
      await new Promise((resolve) => setTimeout(resolve, 800))
      if (email === 'admin@neuroflow.ai' && password === 'admin') {
        return { token: 'mock_jwt_token', requiresMfa: true }
      }
      throw new Error('Credenciais inválidas')
    },
    verifyMfa: async (code: string) => {
      await new Promise((resolve) => setTimeout(resolve, 600))
      if (code === '123456') {
        return { success: true }
      }
      throw new Error('Código inválido')
    },
  },
  data: {
    getDashboardMetrics: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      return {
        flowScore: 82,
        metrics: [
          {
            title: 'VFC (Variabilidade)',
            value: '68 ms',
            trend: '+5%',
            data: [55, 60, 58, 65, 62, 68, 68],
          },
          {
            title: 'Nível de Foco',
            value: '88%',
            trend: '+12%',
            data: [70, 75, 72, 80, 85, 82, 88],
          },
          {
            title: 'Qualidade do Sono',
            value: '7.5h',
            trend: '-2%',
            data: [8, 7.5, 6.5, 7, 8, 7.2, 7.5],
          },
          {
            title: 'Índice de Estresse',
            value: 'Baixo',
            trend: '-15%',
            data: [40, 35, 45, 30, 25, 20, 15],
          },
        ],
        recentActivity: [
          { id: 1, type: 'Meditação', duration: '15 min', time: 'Hoje, 08:30', impact: 'Positivo' },
          {
            id: 2,
            type: 'Trabalho Focado',
            duration: '2h 15m',
            time: 'Hoje, 09:00',
            impact: 'Alto Gasto',
          },
          {
            id: 3,
            type: 'Exercício',
            duration: '45 min',
            time: 'Ontem, 18:00',
            impact: 'Recuperação',
          },
        ],
      }
    },
    getInsights: async () => {
      await new Promise((resolve) => setTimeout(resolve, 700))
      return [
        { date: 'Seg', focus: 65, stress: 45, sleep: 80 },
        { date: 'Ter', focus: 75, stress: 35, sleep: 75 },
        { date: 'Qua', focus: 85, stress: 25, sleep: 85 },
        { date: 'Qui', focus: 70, stress: 50, sleep: 65 },
        { date: 'Sex', focus: 90, stress: 20, sleep: 90 },
        { date: 'Sáb', focus: 60, stress: 15, sleep: 95 },
        { date: 'Dom', focus: 80, stress: 20, sleep: 90 },
      ]
    },
    getLogs: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      return [
        {
          id: '101',
          date: '2023-10-24',
          category: 'Biométrico',
          detail: 'Leitura de VFC: 68ms',
          status: 'Sincronizado',
        },
        {
          id: '102',
          date: '2023-10-24',
          category: 'Comportamental',
          detail: 'Sessão de foco intenso',
          status: 'Registrado',
        },
        {
          id: '103',
          date: '2023-10-23',
          category: 'Sono',
          detail: 'Fase REM prolongada',
          status: 'Analisado',
        },
        {
          id: '104',
          date: '2023-10-22',
          category: 'Alerta',
          detail: 'Pico de cortisol detectado',
          status: 'Atenção',
        },
      ]
    },
  },
}
