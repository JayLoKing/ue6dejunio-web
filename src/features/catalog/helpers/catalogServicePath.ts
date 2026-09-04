const baseModuleUrl = "/catalog"

export const CatalogUrl = {
  Grades: `${baseModuleUrl}/grades`,
  Parallels: `${baseModuleUrl}/parallels`,
  Subjects: `${baseModuleUrl}/subjects`,
  Teachers: `${baseModuleUrl}/teachers`,
  Trimesters: `${baseModuleUrl}/trimesters`,
  AcademicYears: `${baseModuleUrl}/academic-years`,
} as const
