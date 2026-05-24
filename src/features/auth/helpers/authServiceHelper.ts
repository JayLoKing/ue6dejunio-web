import type { UseApiCall } from "@/lib/useApicall"
import type {
  ChangePasswordRequest,
  CredentialsRequest,
} from "../models/requests/credentials-request"
import type {
  CredentialResponse,
  MeResponse,
} from "../models/response/credential-response"
import { loadAbort } from "@/lib/loadAbort"
import { AuthUrl } from "./authServicePath"
import { httpClient } from "@/lib/axios"

export default class AuthServiceHelper {
  signInAsync(payload: CredentialsRequest): UseApiCall<CredentialResponse> {
    const controller = loadAbort()
    return {
      call: httpClient.post<CredentialResponse>(AuthUrl.Login, payload, {
        signal: controller.signal,
      }),
      controller,
    }
  }

  meAsync(): UseApiCall<MeResponse> {
    const controller = loadAbort()
    return {
      call: httpClient.get<MeResponse>(AuthUrl.Me, {
        signal: controller.signal,
      }),
      controller,
    }
  }

  changePasswordAsync(payload: ChangePasswordRequest): UseApiCall<void> {
    const controller = loadAbort()
    return {
      call: httpClient.post<void>(AuthUrl.ChangePassword, payload, {
        signal: controller.signal,
      }),
      controller,
    }
  }
}
