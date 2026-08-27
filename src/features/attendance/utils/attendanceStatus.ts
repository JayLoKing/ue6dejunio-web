import type { AttendanceApiStatus, AttendanceCellStatus } from "../types"

/** What a cell shows, translated to what the API stores. */
export const CELL_TO_API: Record<
  Exclude<AttendanceCellStatus, null>,
  AttendanceApiStatus
> = {
  P: "Present",
  A: "Absent",
  L: "Excused",
}

/** What the API stores, translated to what a cell shows. A late arrival reads as absent. */
export const API_TO_CELL: Record<AttendanceApiStatus, AttendanceCellStatus> = {
  Present: "P",
  Absent: "A",
  Excused: "L",
  Late: "A",
}

/**
 * Reads a status off the wire, where it arrives as a plain string. A status the front end does
 * not know reads as no mark: indexing the table directly would hand back `undefined` through a
 * type that promises it cannot be, and the empty cell is at least honest about knowing nothing.
 */
export const cellFromApi = (status: string): AttendanceCellStatus => {
  // Own keys only: plain indexing would answer "toString" with a function off the prototype.
  if (!Object.hasOwn(API_TO_CELL, status)) return null
  const known: Record<string, AttendanceCellStatus | undefined> = API_TO_CELL
  return known[status] ?? null
}

/** The cycle a cell walks on each click. Every status leads somewhere, so a cell is never stuck. */
export const nextStatus = (
  current: AttendanceCellStatus,
): Exclude<AttendanceCellStatus, null> => {
  switch (current) {
    case null:
      return "P"
    case "P":
      return "A"
    case "A":
      return "L"
    case "L":
      return "P"
  }
}
