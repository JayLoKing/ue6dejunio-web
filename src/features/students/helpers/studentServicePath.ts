const baseModuleUrl = "/course-enrollments"

export const EnrollmentUrl = {
  Single: baseModuleUrl,
  Sync: `${baseModuleUrl}/sync`,
} as const

const studentsModuleUrl = "/students"

export const StudentUrl = {
  ById: (id: string) => `${studentsModuleUrl}/${id}`,
  Withdraw: (id: string) => `${studentsModuleUrl}/${id}/withdraw`,
  /** Sólo el Director: es la única vía de vuelta de un retirado. */
  Reinstate: (id: string) => `${studentsModuleUrl}/${id}/reinstate`,
  /**
   * Movimiento matricular de una gestión: altas y bajas por mes, y bajas por motivo. Sólo
   * Dirección y Secretaría.
   */
  MovementSummary: `${studentsModuleUrl}/movement-summary`,
  /** Quienes cursaron la gestión anterior y no volvieron. Dirección y Secretaría. */
  NotReenrolled: `${studentsModuleUrl}/not-reenrolled`,
} as const
