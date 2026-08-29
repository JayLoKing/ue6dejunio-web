import InstitutionServiceHelper from "../helpers/institutionServiceHelper"
import type { Institution } from "../types"

const helper = new InstitutionServiceHelper()

export class InstitutionService {
  static async current(): Promise<Institution> {
    const { call } = helper.currentAsync()
    return (await call).data
  }
}
