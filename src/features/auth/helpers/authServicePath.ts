const baseModuleUrl = "/auth"

export const AuthUrl = {
  Login: `${baseModuleUrl}/login`,
  /** Renueva con el token vigente: no lleva cuerpo, el usuario sale del token. */
  Refresh: `${baseModuleUrl}/refresh`,
  Me: `${baseModuleUrl}/me`,
  ChangePassword: `${baseModuleUrl}/change-password`,
  ForgotPassword: `${baseModuleUrl}/forgot-password`,
  ResetPassword: `${baseModuleUrl}/reset-password`,
} as const
