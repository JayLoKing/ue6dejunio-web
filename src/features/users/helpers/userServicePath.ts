const baseModuleUrl = "/users"

export const UserUrl = {
  Base: baseModuleUrl,
  ById: (id: string) => `${baseModuleUrl}/${id}`,
} as const
