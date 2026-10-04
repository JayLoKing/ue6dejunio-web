import HandoverServiceHelper from "../helpers/handoverServiceHelper"
import type { StartHandoverRequest } from "../models/requests/handover-request"
import type {
  DirectorHandover,
  UserLookup,
} from "../models/response/handover-response"

const helper = new HandoverServiceHelper()

export class HandoverService {
  /** `null` cuando no hay cambio pendiente (204). */
  static async pending(): Promise<DirectorHandover | null> {
    const { call } = helper.pendingAsync()
    const { data } = await call
    return data === "" ? null : data
  }

  /** `null` cuando el correo no pertenece a nadie (204). */
  static async lookup(email: string): Promise<UserLookup | null> {
    const { call } = helper.lookupAsync(email)
    const { data } = await call
    return data === "" ? null : data
  }

  static async start(payload: StartHandoverRequest): Promise<DirectorHandover> {
    const { call } = helper.startAsync(payload)
    return (await call).data
  }

  static async cancel(): Promise<void> {
    const { call } = helper.cancelAsync()
    await call
  }
}
