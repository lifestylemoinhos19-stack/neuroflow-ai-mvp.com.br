import { useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { linkGuestSessionsToUser } from '@/services/guest-conversion'

const GUEST_TOKEN_KEY = 'neuroflow_guest_token'

export function useGuestConversion() {
  const { user, isAuthenticated } = useAuth()
  const convertedRef = useRef(false)

  useEffect(() => {
    if (!isAuthenticated || !user || convertedRef.current) return

    const guestToken = localStorage.getItem(GUEST_TOKEN_KEY)
    if (!guestToken) {
      convertedRef.current = true
      return
    }

    convertedRef.current = true
    linkGuestSessionsToUser(guestToken, user.id)
      .then(({ linked }) => {
        if (linked > 0) {
          console.info(`Linked ${linked} guest session(s) to user ${user.id}`)
        }
        localStorage.removeItem(GUEST_TOKEN_KEY)
      })
      .catch(() => {
        localStorage.removeItem(GUEST_TOKEN_KEY)
      })
  }, [isAuthenticated, user])
}
