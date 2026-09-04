import StudentServiceHelper from "../helpers/studentServiceHelper"
import type {
  EnrollBatchRequest,
  EnrollSingleRequest,
} from "../models/requests/enroll-request"
import type { WithdrawStudentRequest } from "../models/requests/withdraw-request"
import type { EnrollResponse } from "../models/response/enroll-response"
import type { StudentDetail } from "../types"

const helper = new StudentServiceHelper()

export class StudentService {
  /** La ficha completa, con lo que dice su último cambio de estado. */
  static async getById(id: string): Promise<StudentDetail> {
    const { call } = helper.getByIdAsync(id)
    return (await call).data
  }

  /** Baja lógica: el estudiante deja de estar en el padrón, su ficha y su historia quedan. */
  static async withdraw(
    id: string,
    payload: WithdrawStudentRequest
  ): Promise<void> {
    await helper.withdrawAsync(id, payload).call
  }

  static async enrollSingle(
    payload: EnrollSingleRequest
  ): Promise<EnrollResponse> {
    const { call } = helper.enrollSingleAsync(payload)
    const { data } = await call
    return data
  }

  static async enrollBatch(
    payload: EnrollBatchRequest
  ): Promise<EnrollResponse> {
    const { call } = helper.enrollBatchAsync(payload)
    const { data } = await call
    return data
  }
}
