import { describe, expect, it } from "vitest"

import { annualStatusOf, statusOf } from "./grading"

describe("annualStatusOf", () => {
  // La libreta imprime el promedio anual redondeado a entero (mitad hacia arriba): se aprueba con 51.
  it.each([
    [50.49, "REPROBADO"],
    [50.5, "APROBADO"],
    [50.6, "APROBADO"],
    [51, "APROBADO"],
    [50, "REPROBADO"],
    [0, "REPROBADO"],
    [100, "APROBADO"],
  ] as const)("%s es %s", (average, expected) => {
    expect(annualStatusOf(average)).toBe(expected)
  })

  // 50.495 no es un valor de la API (siempre trae dos decimales), pero el ruido de coma flotante de
  // un promedio recalculado, como 50.49999999999999, tiene que caer del lado de 50.50.
  it("absorbe el ruido de coma flotante en el límite", () => {
    expect(annualStatusOf(50.49999999999999)).toBe("APROBADO")
    expect(annualStatusOf(50.4949999999)).toBe("REPROBADO")
  })
})

describe("statusOf", () => {
  // El trimestral sigue sin redondear: 50.6 es reprobado ahí.
  it("sigue comparando el número sin redondear", () => {
    expect(statusOf(50.6)).toBe("REPROBADO")
    expect(statusOf(51)).toBe("APROBADO")
  })
})
