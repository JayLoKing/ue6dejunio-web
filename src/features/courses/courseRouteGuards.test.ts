import { afterEach, describe, expect, it } from "vitest"

import { useAuthStore } from "@/features/auth/store/authStore"

import { Route as CoursesRoute } from "@/routes/_app/courses"
import { Route as CursosRoute } from "@/routes/_app/cursos"
import { Route as NotebookRoute } from "@/routes/_app/cursos.$parallelId.curso.$courseId"
import { Route as YearsRoute } from "@/routes/_app/gestiones"

/**
 * The course lifecycle (create, one homeroom teacher, duplicate a year's structure) is shared by
 * the Director and the Secretary; the course notebook and the rest of the year admin stay the
 * Director's. The route guard is what keeps a role off a screen whose calls the API would 403.
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

afterEach(() => useAuthStore.setState({ role: null }))

describe.each([
  ["/courses", CoursesRoute],
  ["/cursos", CursosRoute],
  ["/gestiones", YearsRoute],
])("guard de %s", (_path, route) => {
  it("deja pasar a la Dirección", () => {
    expect(runGuard(route, "DIRECTOR")).toBeUndefined()
  })

  it("deja pasar a la secretaría", () => {
    expect(runGuard(route, "SECRETARY")).toBeUndefined()
  })

  it("redirige al docente al dashboard", () => {
    const thrown = runGuard(route, "TEACHER") as { options?: { to?: string } }
    expect(thrown?.options?.to).toBe("/dashboard")
  })
})

describe("guard del cuaderno de un curso", () => {
  it("deja pasar a la Dirección", () => {
    expect(runGuard(NotebookRoute, "DIRECTOR")).toBeUndefined()
  })

  it("deja pasar a la secretaría: lee el cuaderno", () => {
    expect(runGuard(NotebookRoute, "SECRETARY")).toBeUndefined()
  })

  it("redirige al docente al dashboard", () => {
    const thrown = runGuard(NotebookRoute, "TEACHER") as {
      options?: { to?: string }
    }
    expect(thrown?.options?.to).toBe("/dashboard")
  })
})
