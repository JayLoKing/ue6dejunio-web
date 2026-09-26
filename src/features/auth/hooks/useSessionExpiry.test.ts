import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { useAuthStore } from "../store/authStore"
import { useSessionExpiry } from "./useSessionExpiry"

const NOW = new Date("2026-09-25T10:00:00")
const in_ = (minutes: number) =>
  new Date(NOW.getTime() + minutes * 60_000).toISOString()

describe("useSessionExpiry", () => {
  beforeEach(() => {
    // Sólo el reloj. Con los timers falsos completos, react-testing-library se queda esperando
    // tareas que nunca corren.
    vi.useFakeTimers({ toFake: ["Date", "setInterval", "clearInterval"] })
    vi.setSystemTime(NOW)
    useAuthStore.setState({ expiresAt: null, accessToken: null })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("con la sesión recién abierta no avisa nada", () => {
    useAuthStore.setState({ accessToken: "t", expiresAt: in_(15) })

    const { result } = renderHook(() => useSessionExpiry())

    expect(result.current.status).toBe("active")
  })

  /**
   * El aviso llega antes, no cuando ya no se puede hacer nada. Tres minutos es lo que tarda alguien
   * en terminar de cargar la fila que está escribiendo y apretar guardar.
   */
  it("avisa cuando entra en la ventana de aviso", () => {
    useAuthStore.setState({ accessToken: "t", expiresAt: in_(15) })

    const { result } = renderHook(() => useSessionExpiry())

    act(() => {
      vi.advanceTimersByTime(12.5 * 60_000)
    })

    expect(result.current.status).toBe("warning")
    expect(result.current.secondsLeft).toBe(150)
  })

  it("al llegar la hora queda expirada", () => {
    useAuthStore.setState({ accessToken: "t", expiresAt: in_(15) })

    const { result } = renderHook(() => useSessionExpiry())

    act(() => {
      vi.advanceTimersByTime(15 * 60_000)
    })

    expect(result.current.status).toBe("expired")
    expect(result.current.secondsLeft).toBe(0)
  })

  /**
   * Una pestaña dormida vuelve con el vencimiento muy pasado. El estado se calcula de la diferencia
   * de instantes y no descontando de un contador, así que despierta en "expirada" y no en el
   * segundo en que se suspendió.
   */
  it("una sesión vencida hace rato sigue vencida, no cuenta hacia atrás", () => {
    useAuthStore.setState({ accessToken: "t", expiresAt: in_(-40) })

    const { result } = renderHook(() => useSessionExpiry())

    expect(result.current.status).toBe("expired")
    expect(result.current.secondsLeft).toBe(0)
  })

  /** Sin sesión no hay nada que vencer: la pantalla de login no avisa de nada. */
  it("sin token no reporta estado", () => {
    const { result } = renderHook(() => useSessionExpiry())

    expect(result.current.status).toBe("none")
  })

  /** El vencimiento llega del servidor; si viniera ilegible, avisar por las dudas sería peor. */
  it("con un expiresAt ilegible no inventa un vencimiento", () => {
    useAuthStore.setState({ accessToken: "t", expiresAt: "no-es-una-fecha" })

    const { result } = renderHook(() => useSessionExpiry())

    expect(result.current.status).toBe("none")
  })
})
