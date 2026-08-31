import type { Pdc } from "../types"

const MONTHS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
]

const ORDINAL: Record<number, string> = {
  1: "Primer",
  2: "Segundo",
  3: "Tercer",
}

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
 * The form's "Maestro/a" row: the teacher in charge of the course, and only them.
 *
 * <p>One teacher of the grade writes the month and hands it to the parallels. The copy belongs to
 * whoever runs the course it lands in, so the name follows the course rather than the writing —
 * which is why it is not read from the plan's author or from the teachers of its blocks.
 */
export function teacherLine(plan: Pick<Pdc, "homeroomTeacherName">): string {
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
