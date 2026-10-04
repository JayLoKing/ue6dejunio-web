const baseModuleUrl = "/auth"

export const AuthUrl = {
  Login: `${baseModuleUrl}/login`,
  /** Renueva con el token vigente: no lleva cuerpo, el usuario sale del token. */
  Refresh: `${baseModuleUrl}/refresh`,
  Me: `${baseModuleUrl}/me`,
  /** GET trae los campos editables de la propia fila; PUT los guarda. Sin id: sale del token. */
  Profile: `${baseModuleUrl}/profile`,
  ChangePassword: `${baseModuleUrl}/change-password`,
  ForgotPassword: `${baseModuleUrl}/forgot-password`,
  ResetPassword: `${baseModuleUrl}/reset-password`,
} as const
