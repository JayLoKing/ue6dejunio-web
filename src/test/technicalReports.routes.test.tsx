/**
 * The technical teacher has no homeroom course, but reports on the subject they teach: the grades
 * of that subject (the API narrows the centralizers) and its session attendance. Report cards,
 * averages ranking and the pedagogical report stay homeroom-only.
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

// The panels are other tests' business; here each only says what it was handed.
const panel = vi.hoisted(() => async (label: string, extra: string[] = []) => {
  const { createElement } = await import("react")
  return (props: Record<string, unknown>) =>
    createElement(
      "p",
      null,
      `${label}:${["courseId", "classGroupId", "subjectOnly", ...extra]
        .map((key) => `${key}=${String(props[key] ?? "-")}`)
        .join(",")}`
    )
})
vi.mock("@/features/gradebook/components/CentralizerTable", async () => ({
  CentralizerTable: await panel("centralizer"),
}))
vi.mock("@/features/gradebook/components/AnnualSheetsPanel", async () => ({
  AnnualSheetsPanel: await panel("annual", ["year"]),
}))
vi.mock("@/features/gradebook/components/AttendanceReportPanel", async () => ({
  AttendanceReportPanel: await panel("attendance"),
}))
vi.mock("@/features/gradebook/components/AverageRanking", async () => ({
  AverageRanking: await panel("ranking"),
}))
vi.mock("@/features/gradebook/components/ReportCardPanel", async () => ({
  ReportCardPanel: await panel("cards"),
}))
vi.mock("@/features/gradebook/components/PedagogicalReportPanel", () => ({
  PedagogicalReportPanel: () => null,
}))

// The year list: 2027 is the newest but 2026 is the one the Director declared active.
vi.mock("@/features/catalog/hooks/useCatalog", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useAcademicYears: () => ({
    data: [
      { id: 7, year: 2027, active: false, closed: false },
      { id: 6, year: 2026, active: true, closed: false },
    ],
  }),
}))

import { Route as ReportsRoute } from "@/routes/_app/reports.lazy"

const Page = ReportsRoute.options.component as ComponentType

const group = (
  id: string,
  courseId: string,
  subjectName: string,
  gradeName: string,
  parallelName: string
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
  isTechnical: true,
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

describe("Reportes — technical teacher", () => {
  beforeEach(() => {
    context.current = teacher({
      classGroups: [
        group("cg-1", "c-1", "Computación", "Primero", "A"),
        group("cg-2", "c-2", "Robótica", "Segundo", "B"),
      ],
    })
  })

  it("offers only the reports of their subject", () => {
    renderPage()

    const tabs = screen.getAllByRole("tab").map((tab) => tab.textContent)
    expect(tabs).toEqual(["Centralizador", "Consolidado anual", "Asistencia"])
  })

  it("says these are the reports of their subject", () => {
    renderPage()

    expect(screen.getByText(/reportes de tu materia/i)).toBeInTheDocument()
  })

  it("hands the centralizer the first group's course, scoped to the subject", () => {
    renderPage()

    expect(
      screen.getByText(
        "centralizer:courseId=c-1,classGroupId=-,subjectOnly=true"
      )
    ).toBeInTheDocument()
  })

  it("scopes the annual sheet to the subject and dates it with the active year", async () => {
    renderPage()

    await userEvent.click(
      screen.getByRole("tab", { name: "Consolidado anual" })
    )

    expect(
      screen.getByText(
        "annual:courseId=c-1,classGroupId=-,subjectOnly=true,year=2026"
      )
    ).toBeInTheDocument()
  })

  it("reads the attendance of the picked class group", async () => {
    renderPage()

    await userEvent.click(screen.getByRole("combobox", { name: /materia/i }))
    await userEvent.click(
      screen.getByRole("option", { name: "Robótica — Segundo B" })
    )
    await userEvent.click(screen.getByRole("tab", { name: "Asistencia" }))

    expect(
      screen.getByText(
        "attendance:courseId=c-2,classGroupId=cg-2,subjectOnly=-"
      )
    ).toBeInTheDocument()
  })
})

describe("Reportes — other teachers", () => {
  it("keeps the empty state for a teacher with no homeroom and no class groups", () => {
    context.current = teacher({})

    renderPage()

    expect(screen.getByText(/no tienes un curso de aula/i)).toBeInTheDocument()
    expect(screen.queryByRole("tab")).not.toBeInTheDocument()
  })

  it("gives the homeroom teacher the whole course and every tab", () => {
    context.current = teacher({
      isTechnical: false,
      homeroomCourseId: "c-9",
      classGroups: [group("cg-1", "c-1", "Computación", "Primero", "A")],
    })

    renderPage()

    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
      "Centralizador",
      "Consolidado anual",
      "Libretas",
      "Asistencia",
      "Promedios",
      "Informe pedagógico",
    ])
    expect(
      screen.getByText("centralizer:courseId=c-9,classGroupId=-,subjectOnly=-")
    ).toBeInTheDocument()
  })

  it("dates the homeroom teacher's annual sheet with the active year", async () => {
    context.current = teacher({ isTechnical: false, homeroomCourseId: "c-9" })

    renderPage()
    await userEvent.click(
      screen.getByRole("tab", { name: "Consolidado anual" })
    )

    expect(
      screen.getByText(
        "annual:courseId=c-9,classGroupId=-,subjectOnly=-,year=2026"
      )
    ).toBeInTheDocument()
  })
})
