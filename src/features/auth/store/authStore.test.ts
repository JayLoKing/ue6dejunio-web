import { beforeEach, describe, expect, it } from "vitest"

import type { CredentialResponse } from "../models/response/credential-response"
import { useAuthStore } from "./authStore"

const credentials = (): CredentialResponse => ({
  userId: "u-1",
  email: "director@ue6.bo",
  fullName: "Rojas Mario",
  role: "DIRECTOR",
  accessToken: "token",
  tokenType: "Bearer",
  expiresAt: "2026-09-25T10:15:00",
  mustChangePassword: false,
  gradeName: null,
  parallelName: null,
  courseId: null,
  technical: null,
})

describe("authStore", () => {
  beforeEach(() => {
    useAuthStore.getState().logout()
  })

  /**
   * Vencer no es lo mismo que salir.
   *
   * Cuando el interceptor recibe un 401 limpiaba la sesión y empujaba el navegador al login con un
   * `window.location.href`: una recarga entera, en mitad de lo que la persona estuviera escribiendo,
   * sin una palabra de por qué. La bandera deja que la aplicación lo cuente antes de irse.
   */
  it("expireSession borra la sesión pero deja dicho que venció", () => {
    useAuthStore.getState().setSession(credentials())

    useAuthStore.getState().expireSession()

    const state = useAuthStore.getState()
    expect(state.accessToken).toBeNull()
    expect(state.sessionExpired).toBe(true)
  })

  /** Salir a propósito no deja el cartel puesto: no venció nada, se fue quien quiso irse. */
  it("logout no marca la sesión como vencida", () => {
    useAuthStore.getState().setSession(credentials())
    useAuthStore.getState().expireSession()

    useAuthStore.getState().logout()

    expect(useAuthStore.getState().sessionExpired).toBe(false)
  })

  /**
   * Y entrar de nuevo lo baja. Sin esto, un 401 de una contraseña mal escrita dejaba la bandera
   * levantada, y el cartel de "tu sesión expiró" aparecía sobre la sesión recién abierta.
   */
  it("entrar de nuevo limpia la marca de vencimiento", () => {
    useAuthStore.getState().expireSession()

    useAuthStore.getState().setSession(credentials())

    expect(useAuthStore.getState().sessionExpired).toBe(false)
    expect(useAuthStore.getState().accessToken).toBe("token")
  })
})
