const baseModuleUrl = "/adaptations"

export const AdaptationUrl = {
  Base: baseModuleUrl,
  ById: (id: string) => `${baseModuleUrl}/${id}`,
} as const
