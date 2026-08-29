import type { Pdc } from "../types"

const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
]

const ORDINAL: Record<number, string> = { 1: "Primer", 2: "Segundo", 3: "Tercer" }

/**
 * The form's "Áreas" row: the subjects the teacher runs in the course, separated the way the
 * printed row separates its slots.
 *
 * <p>It grows and shrinks with what the teacher actually teaches. A homeroom teacher whose
 * technical subjects are covered by the technical teacher lists seven; one who also runs Música and
 * Religión — because the two technical teachers do not reach every course — lists nine.
 */
export function areaLine(plan: Pick<Pdc, "subjects">): string {
  return plan.subjects
    .map((subject) => subject.subjectName)
    .filter((name): name is string => Boolean(name))
    .join(" / ")
}

/**
 * The form's "Maestro/a" row. The backend derives the names from the blocks, so a plan copied to
 * a parallel names the teacher who runs it there. A plan whose blocks have not been read back yet
 * falls to the homeroom teacher rather than printing an empty row.
 */
export function teacherLine(
  plan: Pick<Pdc, "teacherNames" | "homeroomTeacherName">,
): string {
  if (plan.teacherNames.length > 0) return plan.teacherNames.join(", ")
  return plan.homeroomTeacherName ?? ""
}

/** "03 de agosto" — the form spells the month out rather than printing a numeric date. */
export function spellDate(iso: string | null): string {
  if (!iso) return ""
  const [year, month, day] = iso.split("-").map(Number)
  if (!year || !month || !day) return ""
  return `${String(day).padStart(2, "0")} de ${MONTHS[month - 1]}`
}

/** "Primer", "Segundo", "Tercer" — how the form writes the trimester. */
export function trimesterName(trimester: number): string {
  return ORDINAL[trimester] ?? String(trimester)
}
