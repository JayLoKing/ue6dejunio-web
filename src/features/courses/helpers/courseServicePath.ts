export const CourseUrl = {
  Base: "/courses",
  ById: (id: string) => `/courses/${id}`,
  Homeroom: (id: string) => `/courses/${id}/homeroom-teacher`,
  SwapHomeroom: "/courses/homeroom-teachers/swap",
  Overview: (id: string) => `/courses/${id}/overview`,
} as const

export const CourseEnrollmentUrl = {
  Base: "/course-enrollments",
} as const

export const TeacherClassGroupsUrl = (userId: string) =>
  `/teachers/${userId}/class-groups`
