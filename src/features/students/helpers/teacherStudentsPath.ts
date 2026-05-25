const baseModuleUrl = "/teachers"

export const TeacherStudentsUrl = {
  ByTeacher: (userId: string) => `${baseModuleUrl}/${userId}/students`,
} as const
