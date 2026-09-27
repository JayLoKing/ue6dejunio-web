import { describe, expect, it } from "vitest"

import { isWithdrawn, WITHDRAWN } from "./enrollment"

describe("isWithdrawn", () => {
  it("reconoce el valor que guarda el backend", () => {
    expect(isWithdrawn(WITHDRAWN)).toBe(true)
    expect(isWithdrawn("Withdrawn")).toBe(true)
  })

  it("no da de baja a una matrícula vigente", () => {
    expect(isWithdrawn("Effective")).toBe(false)
  })

  /**
   * Un estado ausente no es una baja. Mientras el listado carga, la fila llega sin estado, y leer
   * eso como una baja bloquearía el cuaderno del curso entero por un instante.
   */
  it("no da de baja a lo que no dice nada", () => {
    expect(isWithdrawn(null)).toBe(false)
    expect(isWithdrawn(undefined)).toBe(false)
    expect(isWithdrawn("")).toBe(false)
  })

  /**
   * Compara exacto. El backend escribe este valor como literal y lo compara con `equals`, así que
   * otra capitalización no es una baja escrita distinto: es un valor que derivó del esquema, y
   * aceptarlo lo taparía. Es la diferencia con `enrollmentStatusLabel`, que sí normaliza — pero
   * sobre el rol, que llega en dos formas de dos fuentes distintas.
   */
  it("no acepta otra capitalización", () => {
    expect(isWithdrawn("withdrawn")).toBe(false)
    expect(isWithdrawn("WITHDRAWN")).toBe(false)
  })
})
