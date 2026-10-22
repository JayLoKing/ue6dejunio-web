import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const useCourseAttendance = vi.hoisted(() => vi.fn())
const useCourseAttendanceStats = vi.hoisted(() => vi.fn())

vi.mock("../hooks/useGradebook", () => ({
  useCourseAttendance,
  useCourseAttendanceStats,
}))

import { CourseAttendancePanel } from "./CourseAttendancePanel"

describe("CourseAttendancePanel", () => {
  beforeEach(() => {
    useCourseAttendanceStats.mockReturnValue({
      isLoading: false,
      isError: false,
      data: undefined,
    })
    useCourseAttendance.mockReturnValue({
      isLoading: false,
      data: { content: [] },
    })
  })

  /**
   * La matriz donde el docente marca dice "Atraso"; esta lectura decía "Retraso". Dos palabras para
   * lo mismo hacen creer que son dos estados distintos.
   */
  it("llama atraso a la llegada tarde, igual que la matriz de registro", () => {
    render(<CourseAttendancePanel courseId="c-1" />)

    expect(screen.getByText("R = Atraso")).toBeInTheDocument()
    expect(screen.queryByText(/retraso/i)).toBeNull()
  })
})
