import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { AttendanceMatrix } from "./AttendanceMatrix"
import type { AttendanceCellStatus } from "../types"

// A Thursday, so the current day always has an editable column. Only Date is faked: user-event
// still needs the real timers to schedule its own work.
const TODAY = new Date(2026, 7, 27)
const TODAY_ISO = "2026-08-27"

const students = [{ courseEnrollmentId: "ce-1", fullName: "Ana Quispe" }]
const noData = () =>
  ({}) as Record<string, Record<string, AttendanceCellStatus>>

/** The cell for the one student on the current day, reached the way a screen reader would. */
const editableCell = () =>
  screen.getByRole("button", { name: new RegExp(`^Ana Quispe, ${TODAY_ISO}:`) })

describe("AttendanceMatrix", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(TODAY)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("cycles the current day's cell on click", async () => {
    const user = userEvent.setup()
    render(
      <AttendanceMatrix
        students={students}
        year={2026}
        month={8}
        initialData={noData()}
        onMark={vi.fn()}
      />
    )

    await user.click(editableCell())

    expect(editableCell()).toHaveTextContent("P")
  })

  // The same shape that overwrote typed scores in the notebook: the server's answer was mirrored
  // into the draft, so any refetch landing before the mutation came back erased the teacher's
  // click. A fresh initialData object carrying no mark yet must not undo what was just marked.
  it("keeps a just-marked cell when a refetch delivers a new initialData", async () => {
    const user = userEvent.setup()
    const props = { students, year: 2026, month: 8, onMark: vi.fn() }
    const { rerender } = render(
      <AttendanceMatrix {...props} initialData={noData()} />
    )

    await user.click(editableCell())
    expect(editableCell()).toHaveTextContent("P")

    // Same content, new reference — exactly what a react-query refetch hands down.
    rerender(<AttendanceMatrix {...props} initialData={noData()} />)

    expect(editableCell()).toHaveTextContent("P")
  })

  it("reports the marked status through onMark", async () => {
    const user = userEvent.setup()
    const onMark = vi.fn()
    render(
      <AttendanceMatrix
        students={students}
        year={2026}
        month={8}
        initialData={noData()}
        onMark={onMark}
      />
    )

    await user.click(editableCell())

    expect(onMark).toHaveBeenCalledWith("ce-1", TODAY_ISO, "Present")
  })

  // Showing a mark the server rejected is worse than showing none: the local mark shadows the
  // server's answer, so no later refetch would ever correct the lie.
  it("takes the mark back when the save is rejected", async () => {
    const user = userEvent.setup()
    const onMark = vi.fn().mockRejectedValue(new Error("network"))
    render(
      <AttendanceMatrix
        students={students}
        year={2026}
        month={8}
        initialData={noData()}
        onMark={onMark}
      />
    )

    await user.click(editableCell())

    await waitFor(() => expect(editableCell()).toHaveTextContent("·"))
  })

  it("falls back to the server's value when the save is rejected", async () => {
    const user = userEvent.setup()
    const onMark = vi.fn().mockRejectedValue(new Error("network"))
    render(
      <AttendanceMatrix
        students={students}
        year={2026}
        month={8}
        initialData={{ "ce-1": { [TODAY_ISO]: "A" } }}
        onMark={onMark}
      />
    )

    await user.click(editableCell())

    await waitFor(() => expect(editableCell()).toHaveTextContent("A"))
  })

  // A rollback restores the value the cell held before its own save. If a second click landed
  // while the first save was still in flight, that value is two steps stale and would undo the
  // newer mark as well.
  it("leaves a newer mark alone when an older save is rejected", async () => {
    const user = userEvent.setup()
    let rejectFirst: (reason: Error) => void = () => {}
    const onMark = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((_resolve, reject) => {
            rejectFirst = reject
          })
      )
      .mockResolvedValueOnce(undefined)

    render(
      <AttendanceMatrix
        students={students}
        year={2026}
        month={8}
        initialData={noData()}
        onMark={onMark}
      />
    )

    await user.click(editableCell()) // P, save still in flight
    await user.click(editableCell()) // A, saved fine
    expect(editableCell()).toHaveTextContent("A")

    rejectFirst(new Error("network"))

    await waitFor(() => expect(onMark).toHaveBeenCalledTimes(2))
    expect(editableCell()).toHaveTextContent("A")
  })

  it("shows what the server already has when nothing was marked locally", () => {
    render(
      <AttendanceMatrix
        students={students}
        year={2026}
        month={8}
        initialData={{ "ce-1": { [TODAY_ISO]: "A" } }}
        onMark={vi.fn()}
      />
    )

    expect(editableCell()).toHaveTextContent("A")
  })
})
