const baseModuleUrl = "/pdc"

export const PdcUrl = {
  Base: baseModuleUrl,
  ById: (id: string) => `${baseModuleUrl}/${id}`,
  Publish: (id: string) => `${baseModuleUrl}/${id}/publish`,
  Approve: (id: string) => `${baseModuleUrl}/${id}/approve`,
  Observe: (id: string) => `${baseModuleUrl}/${id}/observe`,
} as const
