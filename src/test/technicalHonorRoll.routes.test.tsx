/**
 * The technical teacher has no homeroom course, but teaches a subject in several. The honor roll of
 * any of those courses is theirs to read (the API opened it), and it always ranks every subject of
 * the course — the screen must say so, or the teacher reads it as the ranking of their own subject.
 * Lives outside `src/routes` on purpose: the router plugin reads every file there as a route.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ComponentType } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { ClassGroupItem } from "@/features/courses/types/course"

const context = vi.hoisted(() => ({
  current: {} as Record<string, unknown>,
}))

vi.mock("@/features/auth/hooks/useCurrentContext", () => ({
  useCurrentContext: () => context.current,
}))

// The panel is another test's business; here it only says which course it was handed.
vi.mock("@/features/gradebook/components/HonorRollPanel", async () => {
  const { createElement } = await import("react")
  return {
    CourseHonorRollPanel: ({
      courseId,
      courseLabel,
    }: {
      courseId?: string | null
      courseLabel?: string
    }) =>
      createElement(
        "p",
        null,
        `honor:${courseId ?? "none"}:${courseLabel ?? "unnamed"}`
      ),
    InstitutionHonorRollPanel: () => null,
  }
})

import { Route as HonorRoute } from "@/routes/_app/cuadro-de-honor"

const Page = HonorRoute.options.component as ComponentType

const group = (
  id: string,
  courseId: string,
  gradeName: string,
  parallelName: string,
  subjectName = "Computación"
): ClassGroupItem => ({
  id,
  courseId,
  gradeName,
  parallelName,
  subjectId: `s-${subjectName}`,
  subjectName,
  teacherId: "t-1",
  teacherName: "Docente",
  active: true,
})

const teacher = (over: Record<string, unknown>) => ({
  isLoading: false,
  isDirector: false,
  isSecretary: false,
  isTeacher: true,
  isTechnical: false,
  homeroomCourseId: null,
  classGroups: [],
  ...over,
})

function renderPage() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={qc}>
      <Page />
    </QueryClientProvider>
  )
}

const INFO = /considera el promedio de todas las materias del curso/i

beforeEach(() => {
  context.current = teacher({})
})

describe("Cuadro de honor — technical teacher", () => {
  beforeEach(() => {
    context.current = teacher({
      isTechnical: true,
      classGroups: [
        group("g-1", "c-1", "Primero", "A"),
        // Two subjects in the same course: still one course to pick.
        group("g-2", "c-1", "Primero", "A", "Robótica"),
        group("g-3", "c-2", "Segundo", "B"),
      ],
    })
  })

  it("hands the panel the first course they teach in, named", () => {
    renderPage()

    expect(screen.getByText("honor:c-1:Primero A")).toBeInTheDocument()
  })

  it("says the ranking covers every subject of the course, not only theirs", () => {
    renderPage()

    expect(screen.getByText(INFO)).toBeInTheDocument()
  })

  it("offers each course once and switches to the one picked", async () => {
    renderPage()

    await userEvent.click(screen.getByRole("combobox", { name: /curso/i }))
    const options = screen.getAllByRole("option")
    expect(options.map((o) => o.textContent)).toEqual([
      "Primero A",
      "Segundo B",
    ])

    await userEvent.click(screen.getByRole("option", { name: "Segundo B" }))

    expect(screen.getByText("honor:c-2:Segundo B")).toBeInTheDocument()
  })
})

describe("Cuadro de honor — other teachers", () => {
  it("keeps the empty state for a teacher with no homeroom and no class groups", () => {
    context.current = teacher({ isTechnical: true })

    renderPage()

    expect(screen.getByText(/no tienes un curso de aula/i)).toBeInTheDocument()
    expect(screen.queryByText(/^honor:/)).not.toBeInTheDocument()
  })

  it("shows the homeroom teacher their own course with no picker and no notice", () => {
    context.current = teacher({
      homeroomCourseId: "c-9",
      classGroups: [group("g-1", "c-1", "Primero", "A")],
    })

    renderPage()

    expect(screen.getByText(/^honor:c-9:/)).toBeInTheDocument()
    expect(
      screen.queryByRole("combobox", { name: /curso/i })
    ).not.toBeInTheDocument()
    expect(screen.queryByText(INFO)).not.toBeInTheDocument()
  })
})
