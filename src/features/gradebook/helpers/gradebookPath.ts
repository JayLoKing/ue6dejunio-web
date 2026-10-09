const baseModuleUrl = "/gradebook"

export const GradebookUrl = {
  StudentSummary: `${baseModuleUrl}/student-summary`,
  Centralizer: `${baseModuleUrl}/centralizer`,
  AnnualCentralizer: `${baseModuleUrl}/annual-centralizer`,
  ReportCard: `${baseModuleUrl}/report-card`,
  /** El podio de un curso. Lo lee quien lee el curso: docente de aula y Dirección. */
  HonorRoll: `${baseModuleUrl}/honor-roll`,
  /**
   * El podio de toda la unidad educativa en una gestión. Sólo Dirección, y con la gestión
   * obligatoria: un podio que abarcara varios años enfrentaría a un estudiante de 2024 con uno de
   * 2026, cosa que la escuela nunca hace.
   */
  HonorRollInstitution: `${baseModuleUrl}/honor-roll/institution`,
  /**
   * Una fila por curso de la gestión: estudiantes, aprobados, reprobados y promedio.
   *
   * Sólo Dirección. Existe para que el tablero no llame al centralizador una vez por curso, que es
   * lo que hacía falta antes y son treinta peticiones para dibujar una tabla.
   */
  CourseSummary: `${baseModuleUrl}/course-summary`,
  Attendance: `${baseModuleUrl}/attendance`,
  /**
   * RF 37 de una sola materia: el porcentaje de asistencia por estudiante con las marcas de sesión de
   * un class group. Lo lee quien lee el class group, así que es el reporte del docente técnico.
   */
  ClassGroupAttendanceByStudent: `${baseModuleUrl}/attendance/session/by-student`,
  /**
   * El informe pedagógico del curso en un trimestre. Lo lee quien lee el curso; lo escribe sólo el
   * docente de aula, que es el único DOCENTE que el formulario de la escuela lleva.
   */
  PedagogicalReport: `${baseModuleUrl}/pedagogical-report`,
} as const

// Consolidado por dimensión (fuera del prefijo /gradebook).
export const ScoreUrl = {
  Base: "/scores",
} as const

// Estadísticas de asistencia (endpoint bajo /courses).
export const CourseStatsUrl = {
  AttendanceStats: (courseId: string) =>
    `/courses/${courseId}/attendance-stats`,
} as const
