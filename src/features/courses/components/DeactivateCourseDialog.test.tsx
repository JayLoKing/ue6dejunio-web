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
    expect(mutateAsync).not.toHaveBeenCalled()
  })

  it("deactivates the course on confirm and closes", async () => {
    mutateAsync.mockResolvedValue(undefined)
    const onClose = vi.fn()
    render(<DeactivateCourseDialog course={course} onClose={onClose} />)
    await userEvent.click(screen.getByRole("button", { name: "Dar de baja" }))
    expect(mutateAsync).toHaveBeenCalledWith("course-1")
    expect(onClose).toHaveBeenCalled()
  })

  // The API refuses a course with students or records (409); the interceptor already toasted
  // its message, so the dialog neither closes nor adds a second notice.
  it("stays open when the API refuses", async () => {
    mutateAsync.mockRejectedValue(new Error("409"))
    const onClose = vi.fn()
    render(<DeactivateCourseDialog course={course} onClose={onClose} />)
    await userEvent.click(screen.getByRole("button", { name: "Dar de baja" }))
    expect(mutateAsync).toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })

  it("renders nothing without a course", () => {
    render(<DeactivateCourseDialog course={null} onClose={vi.fn()} />)
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
  })
})
