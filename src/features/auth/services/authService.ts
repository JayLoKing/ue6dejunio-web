import AuthServiceHelper from "../helpers/authServiceHelper"
import type {
  ChangePasswordRequest,
  CredentialsRequest,
} from "../models/requests/credentials-request"
import type {
  CredentialResponse,
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
}
