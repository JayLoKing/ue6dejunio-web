/**
 * The summary of a student a teacher reaches from the subject sheet. Lives outside `src/routes` on
 * purpose: the router plugin reads every file there as a route.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import type { ComponentType } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const teacherClassGroups = vi.hoisted(() => vi.fn())
const context = vi.hoisted(() => ({
  homeroomCourseId: null as string | null,
}))

vi.mock("@/features/courses/services/courseService", () => ({
  CourseService: { teacherClassGroups },
}))
vi.mock("@/features/auth/hooks/useCurrentContext", () => ({
  useCurrentContext: () => ({ userId: "t-1", ...context }),
}))
vi.mock("@tanstack/react-router", async (orig) => ({
  ...(await orig<object>()),
  Link: ({ children }: { children: React.ReactNode }) => (
    <a href="#">{children}</a>
  ),
}))
vi.mock("@/features/gradebook/components/StudentGradesDetail", () => ({
  StudentGradesDetail: ({ ownSubjectsOnly }: { ownSubjectsOnly?: boolean }) => (
    <p>{ownSubjectsOnly ? "scoped" : "full"}</p>
  ),
}))

import { Route } from "@/routes/_app/scores.$classGroupId.estudiante.$enrollmentId"

const cg = { id: "cg-1", courseId: "c-1", teacherId: "t-1" }

beforeEach(() => {
  vi.clearAllMocks()
  teacherClassGroups.mockResolvedValue([cg])
  context.homeroomCourseId = null
  vi.spyOn(Route, "useParams").mockReturnValue({
    classGroupId: "cg-1",
    enrollmentId: "ce-1",
  } as never)
})

function open() {
  const Page = Route.options.component as ComponentType
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Page />
    </QueryClientProvider>
  )
}

describe("student summary reached from a subject sheet", () => {
  it("scopes the summary to their own subjects for a teacher who is not the course's homeroom", async () => {
    open()

    expect(await screen.findByText("scoped")).toBeInTheDocument()
  })

  it("keeps the full summary for the course's homeroom teacher", async () => {
    context.homeroomCourseId = "c-1"
    open()

    expect(await screen.findByText("full")).toBeInTheDocument()
  })

  it("says the subject was not found instead of showing a summary", async () => {
    teacherClassGroups.mockResolvedValue([])
    open()

    expect(
      await screen.findByText(/no asignada a tu cuenta/i)
    ).toBeInTheDocument()
  })
})
