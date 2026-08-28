const baseModuleUrl = "/pdc"

export const PdcUrl = {
  Base: baseModuleUrl,
  ById: (id: string) => `${baseModuleUrl}/${id}`,
  Publish: (id: string) => `${baseModuleUrl}/${id}/publish`,
  Approve: (id: string) => `${baseModuleUrl}/${id}/approve`,
  Observe: (id: string) => `${baseModuleUrl}/${id}/observe`,
  Progress: (id: string) => `${baseModuleUrl}/${id}/progress`,
  Subject: (id: string, planSubjectId: string) =>
    `${baseModuleUrl}/${id}/subjects/${planSubjectId}`,
  CopyToParallels: (id: string) => `${baseModuleUrl}/${id}/copy-to-parallels`,
} as const
