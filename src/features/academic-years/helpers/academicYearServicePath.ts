const baseModuleUrl = "/academic-years"

export const AcademicYearUrl = {
  Activate: (id: number) => `${baseModuleUrl}/${id}/activate`,
  Close: (id: number) => `${baseModuleUrl}/${id}/close`,
  Reopen: (id: number) => `${baseModuleUrl}/${id}/reopen`,
} as const
