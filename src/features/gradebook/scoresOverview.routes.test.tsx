/**
 * The subject sheet opens on the trimester in progress, not always on the first one. The selector
 * inside the sheet still switches between the three.
 * Lives outside `src/routes` on purpose: the router plugin reads every file there as a route.
 */
import { render, screen } from "@testing-library/react"
import type { ComponentType } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { ClassGroupItem } from "@/features/courses/types/course"

const trimesters = vi.hoisted(() => ({
  current: {
    data: undefined as unknown,
    isLoading: false,
  },
}))
const overviewTrimester = vi.hoisted(() => ({ calls: [] as number[] }))

vi.mock("@/features/auth/hooks/useCurrentContext", () => ({
  useCurrentContext: () => ({
    userId: "t-1",
    homeroomCourseId: "c-1",
    isTechnical: false,
  }),
}))

const group: ClassGroupItem = {
  id: "cg-1",
  courseId: "c-1",
  gradeName: "Primero",
  parallelName: "A",
  subjectId: "s-1",
  subjectName: "Matematica",
  teacherId: "t-1",
  teacherName: "Nora Arnez",
  active: true,
}

vi.mock("@/features/courses/hooks/useCourses", () => ({
  useTeacherClassGroups: () => ({ data: [group], isLoading: false }),
  useCourseOverview: (_courseId: string | null, trimester: number) => {
    overviewTrimester.calls.push(trimester)
    return { data: { classGroups: [group] }, isLoading: false }
  },
}))

vi.mock("@/features/catalog/hooks/useCatalog", () => ({
  useTrimesters: () => trimesters.current,
}))

// The sheet is its own test's business; here it only says which trimester it opens on.
vi.mock("@/features/notebook/components/SubjectScoreSheet", async () => {
  const { createElement } = await import("react")
  return {
    SubjectScoreSheet: (props: { initialTrimester?: number }) =>
      createElement("p", null, `opens on ${String(props.initialTrimester)}`),
  }
})

import { Route as ScoresRoute } from "@/routes/_app/scores.$classGroupId.index"

const Page = ScoresRoute.options.component as ComponentType

const calendar = [
  { id: "t1", trimester: 1, startDate: "2026-02-02", endDate: "2026-05-08" },
  { id: "t2", trimester: 2, startDate: "2026-05-11", endDate: "2026-08-28" },
  { id: "t3", trimester: 3, startDate: "2026-09-01", endDate: "2026-12-04" },
]

describe("Subject sheet — trimester it opens on", () => {
  beforeEach(() => {
    vi.spyOn(ScoresRoute, "useParams").mockReturnValue({
      classGroupId: "cg-1",
    } as never)
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(new Date(2026, 7, 14))
    overviewTrimester.calls = []
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it("opens on the trimester whose period contains today", () => {
    trimesters.current = { data: calendar, isLoading: false }
    render(<Page />)

    expect(screen.getByText("opens on 2")).toBeInTheDocument()
    expect(overviewTrimester.calls.at(-1)).toBe(2)
  })

  it("waits for the calendar instead of opening on trimester 1", () => {
    trimesters.current = { data: undefined, isLoading: true }
    render(<Page />)

    expect(screen.queryByText(/opens on/)).not.toBeInTheDocument()
    expect(screen.getByText(/Cargando/)).toBeInTheDocument()
  })
})
