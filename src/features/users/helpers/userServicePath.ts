const baseModuleUrl = "/users"

export const UserUrl = {
  Base: baseModuleUrl,
  ById: (id: string) => `${baseModuleUrl}/${id}`,
  ResendCredentials: (id: string) =>
    `${baseModuleUrl}/${id}/resend-credentials`,
} as const
