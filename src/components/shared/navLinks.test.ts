import { describe, expect, it } from "vitest"

import { ADMIN_LINKS, TOP_LINKS } from "./navLinks"

const rolesOf = (to: string) => TOP_LINKS.find((l) => l.to === to)?.roles ?? []

describe("enlaces de Secretaría", () => {
  /**
   * Las tres pantallas ya estaban construidas para Secretaría y sus rutas ya la dejaban pasar
   * (`reports.tsx`, `riesgo.tsx`, `cuadro-de-honor.tsx` la nombran en el `beforeLoad`, y las
   * páginas ramifican `isDirector || isSecretary`). Sin el enlace sólo se llegaba tipeando la URL,
   * que es lo mismo que no tenerlas. Este test es el que faltaba para que eso no vuelva a pasar
   * en silencio.
   */
  it("la deja entrar a las tres pantallas que sus rutas ya admiten", () => {
    expect(rolesOf("/reports")).toContain("SECRETARY")
    expect(rolesOf("/cuadro-de-honor")).toContain("SECRETARY")
    expect(rolesOf("/riesgo")).toContain("SECRETARY")
  })

  /**
   * Dirección arrastraba el mismo olvido y por el mismo motivo: `reports.tsx` la admite y
   * `reports.lazy.tsx` le da su propia vista, pero el enlace decía sólo `TEACHER`, así que llegaba
   * al consolidado de un curso únicamente entrando por la pantalla del curso.
   */
  it("y arregla de paso a Dirección, que tampoco tenía Reportes", () => {
    expect(rolesOf("/reports")).toContain("DIRECTOR")
  })

  /**
   * Leer no es escribir. Secretaría consulta la institución entera, pero el alta de curso, el
   * catálogo académico y la administración de usuarios siguen siendo de Dirección: si un enlace
   * suyo apareciera acá, la pantalla lo rebotaría y el rol vería una puerta que no abre.
   */
  it("no le ofrece ninguna pantalla de administración", () => {
    expect(rolesOf("/users")).toEqual(["DIRECTOR"])
    expect(rolesOf("/courses")).toEqual(["DIRECTOR"])
    for (const link of ADMIN_LINKS) {
      expect(link.roles).toEqual(["DIRECTOR"])
    }
  })

  /**
   * El padrón del docente es su propio curso; el de Dirección y Secretaría es la unidad educativa
   * entera. Comparten el título y no la pantalla, así que el rol tiene que decidir cuál de las dos
   * aparece — nunca las dos.
   */
  it("le da el padrón institucional y no el del docente", () => {
    expect(rolesOf("/estudiantes")).toContain("SECRETARY")
    expect(rolesOf("/students")).not.toContain("SECRETARY")
  })
})

describe("la tabla de enlaces", () => {
  /**
   * El enlace se busca por `to` en todos lados: acá, y en el sidebar para marcar el activo. Dos
   * filas con la misma ruta harían que cuál gana dependa del orden del array.
   */
  it("no repite una ruta", () => {
    const routes = [...TOP_LINKS, ...ADMIN_LINKS].map((l) => l.to)
    expect(new Set(routes).size).toBe(routes.length)
  })

  it("no deja ningún enlace sin rol que lo vea", () => {
    for (const link of [...TOP_LINKS, ...ADMIN_LINKS]) {
      expect(link.roles.length).toBeGreaterThan(0)
    }
  })
})
