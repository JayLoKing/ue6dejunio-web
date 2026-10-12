export interface CredentialsRequest {
  email: string
  password: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  newPassword: string
}

/**
 * Lo que una persona corrige de sí misma desde el perfil. CI y rol son de la escuela; el correo
 * tiene su propio pedido, `ChangeEmailRequest`, porque pide la contraseña.
 */
export interface UpdateProfileRequest {
  names: string
  lastNames: string
  phone: string
}

/** El correo nuevo y la contraseña actual, que prueba que quien tiene la sesión es su dueño. */
export interface ChangeEmailRequest {
  newEmail: string
  currentPassword: string
}
