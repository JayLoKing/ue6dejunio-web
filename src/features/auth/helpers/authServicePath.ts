const baseModuleUrl = "/auth"

export const AuthUrl = {
  Login: `${baseModuleUrl}/login`,
  Me: `${baseModuleUrl}/me`,
  ChangePassword: `${baseModuleUrl}/change-password`,
} as const
