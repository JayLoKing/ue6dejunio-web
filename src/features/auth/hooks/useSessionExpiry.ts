import { useEffect, useState } from "react"

import { useAuthStore } from "../store/authStore"

/** Cuánto antes del vencimiento aparece el aviso. */
export const WARN_BEFORE_SECONDS = 3 * 60

export type SessionStatus = "none" | "active" | "warning" | "expired"

export interface SessionExpiry {
  status: SessionStatus
  /** Segundos hasta el vencimiento, nunca negativo. Cero cuando ya venció. */
  secondsLeft: number
}

/**
 * Cuánto le queda a la sesión, y si hay que avisar.
 *
 * El token dura quince minutos y hasta ahora se vencía en silencio: el siguiente pedido volvía 401,
 * el interceptor limpiaba la sesión y la aplicación saltaba al login en mitad de lo que se estuviera
 * escribiendo. Nadie perdía datos guardados, pero sí el párrafo que estaba tipeando, y sin saber
 * por qué. Este hook es el que permite avisarlo tres minutos antes.
 *
 * NO RENUEVA NADA, y sigue sin hacerlo: sólo dice cuánto queda. Renovar existe —`POST /auth/refresh`,
 * vía `useRefreshSession`— y el botón vive en `SessionExpiryNotice`, que es quien lee este hook.
 * Separados a propósito: este mide el tiempo y nada más, así que ninguna renovación puede cambiar lo
 * que la cuenta regresiva dice. El estado `warning` es la ventana en la que renovar todavía es
 * posible, porque la API exige un token vigente para dar otro.
 *
 * SE CALCULA POR DIFERENCIA DE INSTANTES, no descontando de un contador. Una pestaña dormida deja
 * de recibir ticks: con un contador despertaría en el segundo en que se suspendió y diría que
 * quedan doce minutos cuando hace media hora que venció. Restando contra el reloj, despierta
 * diciendo la verdad.
 */
export function useSessionExpiry(
  warnBeforeSeconds: number = WARN_BEFORE_SECONDS
): SessionExpiry {
  const accessToken = useAuthStore((s) => s.accessToken)
  const expiresAt = useAuthStore((s) => s.expiresAt)

  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!(accessToken && expiresAt)) {
      return
    }
    // Un segundo: es la resolución de la cuenta regresiva que se muestra. Más fino no se ve, y más
    // grueso hace que el número salte de dos en dos, que se lee como que el reloj anda mal.
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [accessToken, expiresAt])

  if (!(accessToken && expiresAt)) {
    return { status: "none", secondsLeft: 0 }
  }

  const deadline = new Date(expiresAt).getTime()
  if (Number.isNaN(deadline)) {
    // Un vencimiento ilegible no es un vencimiento inminente. Avisar por las dudas entrenaría a la
    // gente a descartar el cartel, y entonces no sirve el día que es cierto.
    return { status: "none", secondsLeft: 0 }
  }

  const secondsLeft = Math.max(0, Math.floor((deadline - now) / 1000))
  if (secondsLeft === 0) {
    return { status: "expired", secondsLeft: 0 }
  }
  return {
    status: secondsLeft <= warnBeforeSeconds ? "warning" : "active",
    secondsLeft,
  }
}
