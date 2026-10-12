import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { DeactivateCourseDialog } from "./DeactivateCourseDialog"
import type { Course } from "../types/course"

const course: Course = {
  id: "course-1",
  gradeId: 1,
  gradeName: "Primero",
  parallelId: 1,
  parallelName: "A",
  academicYearId: 1,
  year: 2026,
  homeroomTeacherId: null,
  homeroomTeacherName: null,
  active: true,
  homeroomTeacherActive: false,
}

const mutateAsync = vi.fn()

vi.mock("../hooks/useCourses", () => ({
  useDeactivateCourse: () => ({ mutateAsync, isPending: false }),
}))

beforeEach(() => {
  mutateAsync.mockReset()
})

describe("DeactivateCourseDialog", () => {
  it("names the course and asks before doing anything", () => {
    render(<DeactivateCourseDialog course={course} onClose={vi.fn()} />)
    expect(screen.getByText(/Primero A/)).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "Eliminar o dar de baja el curso" })
    ).toBeInTheDocument()
    expect(mutateAsync).not.toHaveBeenCalled()
  })

  it("explains both outcomes: erased when empty, deactivated and kept otherwise", () => {
    render(<DeactivateCourseDialog course={course} onClose={vi.fn()} />)
    expect(screen.getByText(/se eliminará definitivamente/)).toBeInTheDocument()
    expect(
      screen.getByText(/se conservará toda su información/)
    ).toBeInTheDocument()
    expect(screen.getByText(/podrás reactivarlo después/)).toBeInTheDocument()
  })

  it("removes the course on confirm and closes", async () => {
    mutateAsync.mockResolvedValue({ outcome: "DELETED" })
    const onClose = vi.fn()
    render(<DeactivateCourseDialog course={course} onClose={onClose} />)
    await userEvent.click(screen.getByRole("button", { name: "Continuar" }))
    expect(mutateAsync).toHaveBeenCalledWith("course-1")
    expect(onClose).toHaveBeenCalled()
  })

  // The API can still refuse (a closed gestión answers 409); the interceptor already toasted
  // its message, so the dialog neither closes nor adds a second notice.
  it("stays open when the API refuses", async () => {
    mutateAsync.mockRejectedValue(new Error("409"))
    const onClose = vi.fn()
    render(<DeactivateCourseDialog course={course} onClose={onClose} />)
    await userEvent.click(screen.getByRole("button", { name: "Continuar" }))
    expect(mutateAsync).toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })

  it("renders nothing without a course", () => {
    render(<DeactivateCourseDialog course={null} onClose={vi.fn()} />)
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
  })
})
