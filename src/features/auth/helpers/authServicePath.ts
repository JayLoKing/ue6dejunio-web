const baseModuleUrl = "/auth"

export const AuthUrl = {
  Login: `${baseModuleUrl}/login`,
  Me: `${baseModuleUrl}/me`,
  ChangePassword: `${baseModuleUrl}/change-password`,
  ForgotPassword: `${baseModuleUrl}/forgot-password`,
  ResetPassword: `${baseModuleUrl}/reset-password`,
} as const
