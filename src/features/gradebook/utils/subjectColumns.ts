import type { StudentSubjectTotal, StudentSummary } from "../types"

/**
 * The subject columns the centralizer heads itself with: every subject anybody on the page holds,
 * named once.
 *
 * <p>Read off every row rather than off the first one. A student who is not enrolled in a subject —
 * or who has no score in it yet — comes back with a shorter list, and taking the header from that
 * one row dropped the subject's column for the whole page, classmates who were graded in it
 * included.
 *
 * <p>The fullest row goes first so the order stays the course's own. Building the header from a
 * short row and appending what it lacked would put a missing subject after the ones that follow it
 * in the plan.
 */
export function subjectColumnsOf(
  rows: StudentSummary[]
): StudentSubjectTotal[] {
  const columns = new Map<string, StudentSubjectTotal>()
  // Sort is stable, so rows holding the same number of subjects keep the order the page sent them.
  const fullestFirst = [...rows].sort(
    (a, b) => b.subjects.length - a.subjects.length
  )

  for (const row of fullestFirst) {
    for (const subject of row.subjects) {
      if (!columns.has(subject.classGroupId)) {
        columns.set(subject.classGroupId, subject)
      }
    }
  }

  return [...columns.values()]
}
