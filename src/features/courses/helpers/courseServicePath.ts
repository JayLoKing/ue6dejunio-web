export const CourseUrl = {
  Base: "/courses",
  ById: (id: string) => `/courses/${id}`,
  Homeroom: (id: string) => `/courses/${id}/homeroom-teacher`,
  SwapHomeroom: "/courses/homeroom-teachers/swap",
  Overview: (id: string) => `/courses/${id}/overview`,
  /** RF 37: el porcentaje de asistencia por estudiante. `trimester` ausente = alcance anual. */
  AttendanceByStudent: (id: string) => `/courses/${id}/attendance-by-student`,
} as const

export const CourseEnrollmentUrl = {
  Base: "/course-enrollments",
} as const

export const TeacherClassGroupsUrl = (userId: string): string =>
  `/teachers/${userId}/class-groups`
