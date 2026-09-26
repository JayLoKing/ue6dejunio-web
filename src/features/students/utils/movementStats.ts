import type { StudentMovementMonth } from "../types"

const MONTHS_SHORT = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
]

export function monthLabel(month: number): string {
  return MONTHS_SHORT[month - 1] ?? String(month)
}

/**
 * Los meses en orden cronológico.
 *
 * Ordenados acá y no confiando en la API: el acumulado es una resta corrida y se apoya en el
 * orden. Si marzo llegara antes que febrero, arrancaría de marzo y quedaría mal todo el año.
 */
export function inCalendarOrder(
  months: StudentMovementMonth[]
): StudentMovementMonth[] {
  return [...months].sort((a, b) => a.year - b.year || a.month - b.month)
}

/**
 * La matrícula mes a mes: altas menos bajas, acumulado.
 *
 * Sumar sólo las altas daría cuánta gente pasó alguna vez por la escuela, que no es la matrícula —
 * es el número que Secretaría reporta y tiene que cerrar con la lista de estudiantes activos.
 *
 * Los meses sin movimiento no aparecen, y está bien: la API manda sólo los que tuvieron alguno, y
 * una gestión que empieza en febrero no debería mostrar un enero en cero.
 */
export function runningEnrolment(
  months: StudentMovementMonth[]
): { x: string; y: number }[] {
  let running = 0
  return inCalendarOrder(months).map((m) => {
    running += m.enrolled - m.withdrawn
    return { x: monthLabel(m.month), y: running }
  })
}

/** Altas y bajas mes a mes, con los nombres que van en la leyenda del gráfico. */
export function movementByMonth(
  months: StudentMovementMonth[]
): { name: string; Altas: number; Bajas: number }[] {
  return inCalendarOrder(months).map((m) => ({
    name: monthLabel(m.month),
    Altas: m.enrolled,
    Bajas: m.withdrawn,
  }))
}

/**
 * Cuántos paralelos tiene abiertos cada grado.
 *
 * Es la capacidad instalada, que es contra lo que Secretaría decide dónde entra un estudiante
 * nuevo. Cuenta cursos, no estudiantes: un paralelo con dos chicos sigue siendo un paralelo.
 *
 * Conserva el orden en que llegan los cursos, que la API ya devuelve por grado
 * (`ORDER BY c.grade.id, c.parallel.id`). No los ordena por nombre a propósito: alfabéticamente
 * daría "Cuarto, Primero, Quinto, Segundo", y el gráfico se lee como una escalera de grados.
 */
export function parallelsByGrade(
  courses: { gradeName: string }[]
): { name: string; paralelos: number }[] {
  const totals = new Map<string, number>()
  for (const c of courses) {
    totals.set(c.gradeName, (totals.get(c.gradeName) ?? 0) + 1)
  }
  return [...totals.entries()].map(([name, paralelos]) => ({
    name,
    paralelos,
  }))
}
