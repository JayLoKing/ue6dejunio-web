import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

const useCourseAttendanceByStudent = vi.hoisted(() => vi.fn())
vi.mock("@/features/courses/hooks/useCourses", () => ({
  useCourseAttendanceByStudent,
}))

vi.mock("@/features/institution/hooks/useInstitution", () => ({
  useInstitution: () => ({ data: undefined, isLoading: false }),
}))

import { AttendanceReportPanel } from "./AttendanceReportPanel"
import type { StudentAttendanceRow } from "../types"

const query = (over: Record<string, unknown> = {}) => ({
  data: undefined,
  isLoading: false,
  isError: false,
  ...over,
})

const row = (
  over: Partial<StudentAttendanceRow> = {}
): StudentAttendanceRow => ({
  courseEnrollmentId: "ce-1",
  studentId: "st-1",
  studentName: "Ana Aguilar",
  present: 30,
  absent: 4,
  late: 2,
  excused: 1,
  computableSessions: 36,
  percentage: 83.3,
  ...over,
})

const report = (rows: StudentAttendanceRow[]) =>
  query({
    data: {
      courseId: "c-1",
      scope: "trimester",
      trimester: 1,
      students: {
        content: rows,
        page: 0,
        size: 200,
        total: rows.length,
        totalPages: 1,
      },
    },
  })

describe("AttendanceReportPanel", () => {
  it("muestra los cuatro totales y el porcentaje de cada estudiante", () => {
    useCourseAttendanceByStudent.mockReturnValue(report([row()]))

    render(<AttendanceReportPanel courseId="c-1" trimester={1} />)

    expect(screen.getByText("Ana Aguilar")).toBeInTheDocument()
    expect(screen.getByText("83.3%")).toBeInTheDocument()
  })

  /**
   * Nadie lo marcó, así que no hay porcentaje. Un 0% afirmaría que faltó a todo, que es exactamente
   * lo que no se sabe.
   */
  it("escribe una raya y no un cero para el estudiante sin días computables", () => {
    useCourseAttendanceByStudent.mockReturnValue(
      report([
        row({
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          computableSessions: 0,
          percentage: null,
        }),
      ])
    )

    render(<AttendanceReportPanel courseId="c-1" trimester={1} />)

    expect(screen.getByText("—")).toBeInTheDocument()
    expect(screen.queryByText("0.0%")).not.toBeInTheDocument()
  })

  /**
   * Una consulta que falló no puede caer en la tabla vacía: "nadie tiene asistencia registrada" es
   * una respuesta sobre el curso, y es la contraria a "no se pudo preguntar".
   */
  it("dice que la consulta falló en vez de mostrar un curso sin asistencia", () => {
    useCourseAttendanceByStudent.mockReturnValue(query({ isError: true }))

    render(<AttendanceReportPanel courseId="c-1" trimester={1} />)

    expect(screen.getByText(/No se pudo cargar/)).toBeInTheDocument()
  })

  it("dice que el curso está vacío cuando de verdad no tiene estudiantes", () => {
    useCourseAttendanceByStudent.mockReturnValue(report([]))

    render(<AttendanceReportPanel courseId="c-1" trimester={1} />)

    expect(screen.getByText(/Sin estudiantes en el curso/)).toBeInTheDocument()
  })

  it("no pide nada sin curso elegido", () => {
    useCourseAttendanceByStudent.mockReturnValue(query())

    render(<AttendanceReportPanel courseId={null} trimester={1} />)

    expect(screen.getByText(/Selecciona un curso/)).toBeInTheDocument()
  })

  it("ofrece exportar cuando sabe cómo nombrar el curso", () => {
    useCourseAttendanceByStudent.mockReturnValue(report([row()]))

    render(
      <AttendanceReportPanel
        courseId="c-1"
        trimester={1}
        courseLabel="Primero A"
      />
    )

    expect(
      screen.getByRole("button", { name: /exportar docx/i })
    ).toBeInTheDocument()
  })

  /** Sin saber de qué curso es, el documento no podría declarar su alcance. */
  it("no ofrece exportar sin nombre de curso", () => {
    useCourseAttendanceByStudent.mockReturnValue(report([row()]))

    render(<AttendanceReportPanel courseId="c-1" trimester={1} />)

    expect(
      screen.queryByRole("button", { name: /exportar docx/i })
    ).not.toBeInTheDocument()
  })

  /** El alcance anual es el trimestre ausente, y el documento lo tiene que decir. */
  it("pide el alcance anual con trimestre en null", () => {
    useCourseAttendanceByStudent.mockReturnValue(report([row()]))

    render(<AttendanceReportPanel courseId="c-1" trimester={null} />)

    expect(useCourseAttendanceByStudent).toHaveBeenCalledWith(
      "c-1",
      null,
      expect.objectContaining({ limit: 200 })
    )
  })
})
