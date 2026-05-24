import ClassGroupServiceHelper from "../helpers/classGroupServiceHelper"
import type { CreateClassGroupRequest } from "../models/requests/create-class-group-request"
import type { CreateClassGroupResponse } from "../models/response/class-group-response"

const helper = new ClassGroupServiceHelper()

export class ClassGroupService {
  static async create(
    payload: CreateClassGroupRequest,
  ): Promise<CreateClassGroupResponse> {
    const { call } = helper.createAsync(payload)
    const { data } = await call
    return data
  }
}
