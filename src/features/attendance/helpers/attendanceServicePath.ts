const baseModuleUrl = "/attendance"

export const AttendanceUrl = {
  Daily: `${baseModuleUrl}/daily`,
  DailyBatch: `${baseModuleUrl}/daily/batch`,
  Session: `${baseModuleUrl}/session`,
  SessionBatch: `${baseModuleUrl}/session/batch`,
  Base: baseModuleUrl,
  /**
   * Las marcas de sesión de un class group, por estudiante del curso. La API la sirve bajo
   * /gradebook, pero es la lectura que la pantalla de asistencia por materia necesita para mostrar
   * lo que ya se guardó.
   */
  ClassGroupSessions: "/gradebook/attendance/session",
} as const
