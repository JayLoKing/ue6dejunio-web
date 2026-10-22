/**
 * Having no homeroom course does not make a teacher technical. A homeroom teacher the Director has
 * not assigned a course yet must be told so, not that they are a technical teacher; the technical
 * branch belongs to `isTechnical` alone.
 * Lives outside `src/routes` on purpose: the router plugin reads every file there as a route.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import type { ComponentType } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const context = vi.hoisted(() => ({
  current: {} as Record<string, unknown>,
}))

vi.mock("@/features/auth/hooks/useCurrentContext", () => ({
  useCurrentContext: () => context.current,
}))

const idleQuery = vi.hoisted(() => () => ({
  data: undefined,
  isLoading: false,
  isFetching: false,
  refetch: () => undefined,
}))
const idleMutation = vi.hoisted(() => () => ({ mutateAsync: async () => {} }))

vi.mock("@/features/catalog/hooks/useCatalog", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useAcademicYears: () => ({
    data: [{ id: 6, year: 2026, active: true, closed: false }],
  }),
}))
vi.mock("@/features/courses/hooks/useCourses", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useCourseStudents: idleQuery,
}))
vi.mock("@/features/gradebook/hooks/useGradebook", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useCourseAttendance: idleQuery,
}))
vi.mock("@/features/attendance/hooks/useAttendance", () => ({
  useDailyAttendance: idleMutation,
  useDailyAttendanceBatch: idleMutation,
  useSessionAttendance: idleMutation,
  useSessionAttendanceBatch: idleMutation,
}))

// The charts and matrices are other tests' business; here each only says it was rendered.
vi.mock("@/features/gradebook/components/DashboardCharts", () => ({
  DashboardCharts: ({ courseId }: { courseId: string }) => `charts:${courseId}`,
}))
vi.mock("@/features/gradebook/components/DirectorDashboardCharts", () => ({
  DirectorDashboardCharts: () => "director-charts",
}))
vi.mock("@/features/students/components/SecretaryDashboardCharts", () => ({
  SecretaryDashboardCharts: () => "secretary-charts",
}))
vi.mock("@/features/attendance/components/AttendanceMatrix", () => ({
  AttendanceMatrix: () => "matrix",
}))
vi.mock("@/features/students/components/StudentsTable", () => ({
  StudentsTable: () => "students-table",
}))
vi.mock("@/features/students/components/StudentWithdrawalDialog", () => ({
  StudentWithdrawalDialog: () => null,
}))
vi.mock("@/features/students/components/EnrollStudentDialog", () => ({
  EnrollStudentDialog: () => null,
}))

import { Route as AttendanceRoute } from "@/routes/_app/attendance.lazy"
import { Route as DashboardRoute } from "@/routes/_app/dashboard"
import { Route as StudentsRoute } from "@/routes/_app/students"

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

function renderPage(Page: ComponentType) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={qc}>
      <Page />
    </QueryClientProvider>
  )
}

const NO_COURSE = /aún no tienes un curso de aula asignado/i

function expectNeutralNotice(what: RegExp) {
  expect(screen.getByText(NO_COURSE)).toHaveTextContent(what)
  expect(screen.queryByText(/técnico/i)).not.toBeInTheDocument()
}

const Dashboard = DashboardRoute.options.component as ComponentType
const Attendance = AttendanceRoute.options.component as ComponentType
const Students = StudentsRoute.options.component as ComponentType

describe("A homeroom teacher with no course yet", () => {
  beforeEach(() => {
    context.current = teacher({})
  })

  it("is told on the dashboard that the course indicators come with the course", () => {
    renderPage(Dashboard)

    expectNeutralNotice(/aquí verás los indicadores del curso/i)
  })

  it("is told on attendance that the daily attendance comes with the course", () => {
    renderPage(Attendance)

    expectNeutralNotice(/aquí verás la asistencia diaria del curso/i)
    expect(screen.queryByText("matrix")).not.toBeInTheDocument()
  })

  it("still marks session attendance for a class group they hold, without being called technical", () => {
    context.current = teacher({
      classGroups: [
        {
          id: "g-1",
          courseId: "c-1",
          gradeName: "Primero",
          parallelName: "A",
          subjectId: "s-1",
          subjectName: "Música",
          teacherId: "t-1",
          teacherName: "Docente",
          active: true,
        },
      ],
    })

    renderPage(Attendance)

    expect(screen.getByText("Asistencia de mi materia")).toBeInTheDocument()
    expect(screen.getByText("matrix")).toBeInTheDocument()
    expect(screen.queryByText(/técnico/i)).not.toBeInTheDocument()
    expect(screen.queryByText(NO_COURSE)).not.toBeInTheDocument()
  })

  it("is told on students that the roster comes with the course", () => {
    renderPage(Students)

    expectNeutralNotice(/aquí verás el padrón del curso/i)
  })
})

describe("A technical teacher keeps the technical screens", () => {
  beforeEach(() => {
    context.current = teacher({ isTechnical: true })
  })

  it("keeps the technical notice on the dashboard", () => {
    renderPage(Dashboard)

    expect(
      screen.getByText(/docente técnico: sin curso de aula/i)
    ).toBeVisible()
    expect(screen.queryByText(NO_COURSE)).not.toBeInTheDocument()
  })

  it("keeps the subject attendance on attendance", () => {
    renderPage(Attendance)

    expect(screen.getByText("Asistencia de mi materia")).toBeInTheDocument()
    expect(screen.getByText(/\(docente técnico\)/i)).toBeInTheDocument()
    expect(screen.queryByText(NO_COURSE)).not.toBeInTheDocument()
  })

  it("keeps the technical notice on students", () => {
    renderPage(Students)

    expect(screen.getByText(/como docente técnico/i)).toBeInTheDocument()
    expect(screen.queryByText(NO_COURSE)).not.toBeInTheDocument()
  })
})

describe("A homeroom teacher with a course keeps their course", () => {
  beforeEach(() => {
    context.current = teacher({ homeroomCourseId: "c-9" })
  })

  it("sees the course charts on the dashboard", () => {
    renderPage(Dashboard)

    expect(screen.getByText("charts:c-9")).toBeInTheDocument()
  })

  it("sees the daily attendance of the course", () => {
    renderPage(Attendance)

    expect(screen.getByText("Asistencia diaria del curso")).toBeInTheDocument()
    expect(screen.getByText("matrix")).toBeInTheDocument()
  })

  it("sees the roster of the course", () => {
    renderPage(Students)

    expect(screen.getByText("students-table")).toBeInTheDocument()
  })
})
