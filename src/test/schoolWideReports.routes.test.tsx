/**
 * Director and secretariat read the reports of any course they pick, except the pedagogical report:
 * it lists the students failing the trimester for the homeroom teacher who has to act on them, and
 * the API answers 403 to anybody else. Offering the tab would only show an error.
 * Lives outside `src/routes` on purpose: the router plugin reads every file there as a route.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import type { ComponentType } from "react"
import { describe, expect, it, vi } from "vitest"

const context = vi.hoisted(() => ({
  current: {} as Record<string, unknown>,
}))

vi.mock("@/features/auth/hooks/useCurrentContext", () => ({
  useCurrentContext: () => context.current,
}))

vi.mock("@/features/courses/hooks/useActiveYearCourses", () => ({
  useActiveYearCourses: () => ({
    isLoading: false,
    isError: false,
    data: {
      content: [
        { id: "c-1", gradeName: "Primero", parallelName: "A", year: 2026 },
      ],
    },
  }),
}))

// The panels are other tests' business.
vi.mock("@/features/gradebook/components/CentralizerTable", () => ({
  CentralizerTable: () => null,
}))
vi.mock("@/features/gradebook/components/AnnualSheetsPanel", () => ({
  AnnualSheetsPanel: () => null,
}))
vi.mock("@/features/gradebook/components/AttendanceReportPanel", () => ({
  AttendanceReportPanel: () => null,
}))
vi.mock("@/features/gradebook/components/AverageRanking", () => ({
  AverageRanking: () => null,
}))
vi.mock("@/features/gradebook/components/ReportCardPanel", () => ({
  ReportCardPanel: () => null,
}))
vi.mock("@/features/gradebook/components/PedagogicalReportPanel", () => ({
  PedagogicalReportPanel: () => null,
}))

import { Route as ReportsRoute } from "@/routes/_app/reports.lazy"

const Page = ReportsRoute.options.component as ComponentType

const staff = (over: Record<string, unknown>) => ({
  isLoading: false,
  isDirector: false,
  isSecretary: false,
  isTeacher: false,
  isTechnical: false,
  homeroomCourseId: null,
  classGroups: [],
  ...over,
})

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={qc}>
      <Page />
    </QueryClientProvider>
  )
}

describe.each([
  { role: "Director", ctx: staff({ isDirector: true }) },
  { role: "Secretary", ctx: staff({ isSecretary: true }) },
])("Reportes — $role", ({ ctx }) => {
  it("offers the course's reports without the pedagogical report", () => {
    context.current = ctx

    renderPage()

    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
      "Centralizador",
      "Consolidado anual",
      "Libretas",
      "Asistencia",
      "Promedios",
    ])
  })
})
