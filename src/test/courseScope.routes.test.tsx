/**
 * Every screen that offers a course to pick reads the courses of ONE year. After a year's
 * structure is duplicated the school holds two years of courses, and an unscoped list would offer
 * "Primero A" twice. Lives outside `src/routes` on purpose: the router plugin reads every file
 * there as a route.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ComponentType } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const academicYears = vi.hoisted(() => vi.fn())
const list = vi.hoisted(() => vi.fn())

vi.mock("@/features/catalog/services/catalogService", () => ({
  CatalogService: { academicYears },
}))
vi.mock("@/features/courses/services/courseService", () => ({
  CourseService: { list },
}))
vi.mock("@/features/auth/hooks/useCurrentContext", () => ({
  useCurrentContext: () => ({
    isLoading: false,
    isDirector: true,
    isSecretary: false,
    isTechnical: false,
    homeroomCourseId: null,
    classGroups: [],
  }),
}))

// The panels are another test's business; here they only say which course they were handed. Built
// with an async import because a hoisted factory runs before this file's own imports.
const panel = vi.hoisted(() => async (label: string) => {
  const { createElement } = await import("react")
  return ({ courseId }: { courseId?: string | null }) =>
    createElement("p", null, `${label}:${courseId ?? "none"}`)
})
vi.mock("@/features/gradebook/components/HonorRollPanel", async () => ({
  CourseHonorRollPanel: await panel("honor"),
  InstitutionHonorRollPanel: () => null,
}))
vi.mock("@/features/risk/components/CourseRiskPanel", async () => ({
  CourseRiskPanel: await panel("risk"),
}))
vi.mock("@/features/risk/components/ClassGroupRiskPanel", () => ({
  ClassGroupRiskPanel: () => null,
}))
vi.mock("@/features/risk/components/InstitutionRiskPanel", () => ({
  InstitutionRiskPanel: () => null,
}))
vi.mock("@/features/risk/hooks/useRisk", () => ({
  usePredictYearRisk: () => ({ isPending: false, mutate: vi.fn() }),
}))
vi.mock("@/components/shared/TrimesterSelect", () => ({
  TrimesterSelect: () => null,
}))
vi.mock("@/features/gradebook/components/CentralizerTable", async () => ({
  CentralizerTable: await panel("reports"),
}))
vi.mock("@/features/gradebook/components/AverageRanking", () => ({
  AverageRanking: () => null,
}))
vi.mock("@/features/gradebook/components/AnnualSheetsPanel", () => ({
  AnnualSheetsPanel: () => null,
}))
vi.mock("@/features/gradebook/components/AttendanceReportPanel", () => ({
  AttendanceReportPanel: () => null,
}))
vi.mock("@/features/gradebook/components/ReportCardPanel", () => ({
  ReportCardPanel: () => null,
}))
vi.mock("@/features/gradebook/components/PedagogicalReportPanel", () => ({
  PedagogicalReportPanel: () => null,
}))

import { Route as HonorRoute } from "@/routes/_app/cuadro-de-honor"
import { Route as RiskRoute } from "@/routes/_app/riesgo"
import { Route as ReportsRoute } from "@/routes/_app/reports.lazy"

const Y2026 = { id: 1, year: 2026, active: true, closed: false }
const Y2027 = { id: 2, year: 2027, active: false, closed: false }

const course = (id: string, academicYearId: number) => ({
  id,
  gradeName: "Primero",
  parallelName: "A",
  academicYearId,
  year: academicYearId === 1 ? 2026 : 2027,
})

let qc: QueryClient

function renderRoute(Page: ComponentType) {
  render(
    <QueryClientProvider client={qc}>
      <Page />
    </QueryClientProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  academicYears.mockResolvedValue([Y2027, Y2026])
  // Like the API: only the courses of the year asked for.
  list.mockImplementation((_query: unknown, yearId?: number) =>
    Promise.resolve({
      // The other year first: an unscoped list would hand the screen the wrong first course.
      content: [course("c-2027", 2), course("c-2026", 1)].filter(
        (c) => yearId === undefined || c.academicYearId === yearId
      ),
    })
  )
  qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
})

const cases = [
  {
    name: "Cuadro de honor",
    Page: HonorRoute.options.component as ComponentType,
    tab: "Por curso",
    shown: "honor:c-2026",
  },
  {
    name: "Riesgo",
    Page: RiskRoute.options.component as ComponentType,
    tab: "Por curso",
    shown: "risk:c-2026",
  },
  {
    name: "Reportes",
    Page: ReportsRoute.options.component as ComponentType,
    tab: null,
    shown: "reports:c-2026",
  },
]

describe.each(cases)("$name", ({ Page, tab, shown }) => {
  async function open() {
    renderRoute(Page)
    if (tab)
      await userEvent.click(await screen.findByRole("tab", { name: tab }))
  }

  it("asks for the courses of the active year, never an unscoped list", async () => {
    await open()

    await waitFor(() => expect(list).toHaveBeenCalled())
    for (const call of list.mock.calls) {
      expect(call[1]).toBe(1)
    }
  })

  it("hands the screen the active year's first course, not the other year's", async () => {
    await open()

    expect(await screen.findByText(shown)).toBeInTheDocument()
    expect(screen.queryByText(/c-2027/)).not.toBeInTheDocument()
  })

  it("says the courses failed to load instead of reading as no courses", async () => {
    list.mockRejectedValue(new Error("boom"))
    await open()

    expect(
      await screen.findAllByText(/no se pudieron cargar los cursos/i)
    ).not.toHaveLength(0)
    expect(screen.queryByText(/no hay cursos/i)).not.toBeInTheDocument()
  })
})

describe("Reportes", () => {
  it("does not claim there are no courses while it is still finding the active year", () => {
    academicYears.mockReturnValue(new Promise(() => {}))

    renderRoute(ReportsRoute.options.component as ComponentType)

    expect(screen.queryByText(/no hay cursos/i)).not.toBeInTheDocument()
    expect(screen.getByText(/cargando los cursos/i)).toBeInTheDocument()
  })
})
