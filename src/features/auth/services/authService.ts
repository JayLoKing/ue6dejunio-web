import AuthServiceHelper from "../helpers/authServiceHelper"
import type {
  ChangePasswordRequest,
  CredentialsRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from "../models/requests/credentials-request"
import type {
  CredentialResponse,
  ForgotPasswordResponse,
  MeResponse,
} from "../models/response/credential-response"

const helper = new AuthServiceHelper()

export class AuthService {
  static async login(payload: CredentialsRequest): Promise<CredentialResponse> {
    const { call } = helper.signInAsync(payload)
    const response = await call
    return response.data
  }

  static async me(): Promise<MeResponse> {
    const { call } = helper.meAsync()
    const response = await call
    return response.data
  }

  static async changePassword(payload: ChangePasswordRequest): Promise<void> {
    const { call } = helper.changePasswordAsync(payload)
    await call
  }

  static async forgotPassword(
    payload: ForgotPasswordRequest
  ): Promise<ForgotPasswordResponse> {
    const { call } = helper.forgotPasswordAsync(payload)
    return (await call).data
  }

  static async resetPassword(payload: ResetPasswordRequest): Promise<void> {
    const { call } = helper.resetPasswordAsync(payload)
    await call
  }
}
