import { afterEach, describe, expect, it } from "vitest"

import { useAuthStore } from "@/features/auth/store/authStore"

import { Route as AttendanceRoute } from "@/routes/_app/attendance"
import { Route as ScoresRoute } from "@/routes/_app/scores"

/**
 * El cuaderno pedagógico (criterios, ítems, notas, asistencia) lo escribe solo el docente
 * dueño; la API le responde 403 a la Dirección en cada escritura. Toda pantalla que escribe
 * vive bajo estas dos rutas, así que el candado es que la Dirección no pueda entrar. Este test
 * lo fija: si alguien abre la ruta a la Dirección, aparecería un cuaderno editable que la API
 * rechazaría con 403 en cada celda.
 */
type Guard = () => unknown

function runGuard(route: unknown, role: string): unknown {
  useAuthStore.setState({ role })
  const guard = (route as { options: { beforeLoad: Guard } }).options.beforeLoad
  try {
    guard()
    return undefined
  } catch (thrown) {
    return thrown
  }
}

describe.each([
  ["/scores", ScoresRoute],
  ["/attendance", AttendanceRoute],
])("guard de %s", (_path, route) => {
  afterEach(() => useAuthStore.setState({ role: null }))

  it("redirige a la Dirección al dashboard", () => {
    const thrown = runGuard(route, "DIRECTOR") as { options?: { to?: string } }
    expect(thrown?.options?.to).toBe("/dashboard")
  })

  it("redirige a la secretaría al dashboard", () => {
    const thrown = runGuard(route, "SECRETARY") as { options?: { to?: string } }
    expect(thrown?.options?.to).toBe("/dashboard")
  })

  it("deja pasar al docente", () => {
    expect(runGuard(route, "TEACHER")).toBeUndefined()
  })
})
