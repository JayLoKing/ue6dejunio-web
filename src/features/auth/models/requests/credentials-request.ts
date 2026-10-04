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

/** Lo único que una persona puede corregir de sí misma; CI, correo y rol son de la escuela. */
export interface UpdateProfileRequest {
  names: string
  lastNames: string
  phone: string
}
