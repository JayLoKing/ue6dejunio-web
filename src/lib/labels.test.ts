import { describe, expect, it } from "vitest"

import { enrollmentStatusLabel, roleBadgeVariant, roleLabel } from "./labels"

describe("roleLabel", () => {
  it("nombra los tres roles como los nombra la unidad educativa", () => {
    expect(roleLabel("Director")).toBe("Director")
    expect(roleLabel("Secretary")).toBe("Secretario")
    expect(roleLabel("Teacher")).toBe("Docente")
  })

  /**
   * El backend manda el rol tal cual lo guarda, y el store de sesión lo pasa en mayúsculas en
   * algunos lugares. Traducir sólo una de las dos formas dejaría media interfaz en inglés.
   */
  it("no le importa la caja en la que venga", () => {
    expect(roleLabel("TEACHER")).toBe("Docente")
    expect(roleLabel("secretary")).toBe("Secretario")
  })

  /**
   * Un rol que la API agregue mañana se muestra tal cual en vez de desaparecer.
   *
   * Una celda vacía en la columna Rol se lee como "este usuario no tiene rol", que es una
   * afirmación distinta y falsa.
   */
  it("muestra un rol que no conoce en vez de tragárselo", () => {
    expect(roleLabel("Auditor")).toBe("Auditor")
  })

  it("responde vacío sin rol, para que quien llama decida qué decir", () => {
    expect(roleLabel(null)).toBe("")
    expect(roleLabel(undefined)).toBe("")
  })
})

describe("enrollmentStatusLabel", () => {
  it("traduce los dos estados que la API usa", () => {
    expect(enrollmentStatusLabel("Effective")).toBe("Activo")
    expect(enrollmentStatusLabel("Withdrawn")).toBe("Dado de baja")
  })

  it("no le importa la caja", () => {
    expect(enrollmentStatusLabel("EFFECTIVE")).toBe("Activo")
  })

  it("muestra un estado desconocido en vez de tragárselo", () => {
    expect(enrollmentStatusLabel("Suspended")).toBe("Suspended")
  })

  it("responde vacío sin estado", () => {
    expect(enrollmentStatusLabel(null)).toBe("")
  })
})

describe("roleBadgeVariant", () => {
  it("le da a cada rol su tono, sin importar la caja", () => {
    expect(roleBadgeVariant("Director")).toBe("default")
    expect(roleBadgeVariant("SECRETARY")).toBe("secondary")
    expect(roleBadgeVariant("teacher")).toBe("outline")
  })

  /** Vive junto a `roleLabel` para que un rol nuevo se agregue en un archivo y no en dos. */
  it("le da tono neutro a un rol que no conoce, y a la ausencia", () => {
    expect(roleBadgeVariant("Auditor")).toBe("outline")
    expect(roleBadgeVariant(null)).toBe("outline")
  })
})
