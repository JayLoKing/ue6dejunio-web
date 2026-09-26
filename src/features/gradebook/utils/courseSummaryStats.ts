import type { CourseAcademicSummary } from "../types"

/** "Quinto B" — como la escuela nombra un curso cuando habla de uno. */
export function courseLabel(course: {
  gradeName: string
  parallelName: string
}): string {
  return `${course.gradeName} ${course.parallelName}`
}

/**
 * Los cursos que tienen nota, con su promedio.
 *
 * Los que nadie calificó quedan afuera en vez de entrar como cero. Un cero los dibujaría como el
 * peor curso de la escuela, que es la lectura contraria a la verdadera: todavía no se los evaluó.
 */
export function averagesByCourse(
  rows: CourseAcademicSummary[]
): { name: string; promedio: number }[] {
  return rows.flatMap((r) =>
    r.average === null ? [] : [{ name: courseLabel(r), promedio: r.average }]
  )
}

/**
 * El promedio de una gestión entera, ponderado por estudiantes.
 *
 * Promediar los promedios de curso trataría un paralelo de ocho igual que uno de treinta, y la
 * escuela no tiene cursos del mismo tamaño. Los cursos sin calificar quedan afuera del cálculo
 * entero — numerador y denominador — porque un curso sin nota no es un curso con cero.
 *
 * @returns `null` si nadie calificó nada, que no es lo mismo que un promedio de cero.
 */
export function weightedAverage(rows: CourseAcademicSummary[]): number | null {
  let weighted = 0
  let students = 0
  for (const r of rows) {
    if (r.average === null) continue
    weighted += r.average * r.students
    students += r.students
  }
  if (students === 0) return null
  return Number((weighted / students).toFixed(1))
}

/**
 * La matrícula sumada por grado, no por paralelo.
 *
 * Dirección decide aperturas de paralelo mirando cuánta gente hay en el grado, no cómo quedó
 * repartida en los paralelos que ya abrió.
 */
export function enrolmentByGrade(
  rows: CourseAcademicSummary[]
): { name: string; estudiantes: number }[] {
  const totals = new Map<string, number>()
  for (const r of rows) {
    totals.set(r.gradeName, (totals.get(r.gradeName) ?? 0) + r.students)
  }
  return [...totals.entries()].map(([name, estudiantes]) => ({
    name,
    estudiantes,
  }))
}
