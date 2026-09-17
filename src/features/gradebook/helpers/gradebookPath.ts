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
  Attendance: `${baseModuleUrl}/attendance`,
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
