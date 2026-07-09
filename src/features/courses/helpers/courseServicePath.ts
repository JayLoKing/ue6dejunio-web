export const CourseUrl = {
  Base: "/courses",
  ById: (id: string) => `/courses/${id}`,
  Homeroom: (id: string) => `/courses/${id}/homeroom-teacher`,
} as const

export const CourseEnrollmentUrl = {
  Base: "/course-enrollments",
  Sync: "/course-enrollments/sync",
} as const

export const TeacherClassGroupsUrl = (userId: string) =>
  `/teachers/${userId}/class-groups`
