const baseModuleUrl = "/academic-years"

export const AcademicYearUrl = {
  Base: baseModuleUrl,
  Activate: (id: number) => `${baseModuleUrl}/${id}/activate`,
  Close: (id: number) => `${baseModuleUrl}/${id}/close`,
  Reopen: (id: number) => `${baseModuleUrl}/${id}/reopen`,
  DuplicateStructure: (targetId: number) =>
    `${baseModuleUrl}/${targetId}/duplicate-structure`,
} as const
