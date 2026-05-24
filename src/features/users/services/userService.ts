import UserServiceHelper from "../helpers/userServiceHelper"
import type { CreateUserRequest } from "../models/requests/create-user-request"
import type {
  ListUsersQuery,
  UpdateUserRequest,
} from "../models/requests/update-user-request"
import type {
  PagedResponse,
  UserResponse,
  UsersListItem,
} from "../models/response/user-response"

const helper = new UserServiceHelper()

export class UserService {
  static async create(payload: CreateUserRequest): Promise<UserResponse> {
    const { call } = helper.createAsync(payload)
    const response = await call
    return response.data
  }

  static async list(
    query: ListUsersQuery = {},
  ): Promise<PagedResponse<UsersListItem>> {
    const { call } = helper.listAsync(query)
    const response = await call
    return response.data
  }

  static async getById(id: string): Promise<UserResponse> {
    const { call } = helper.getByIdAsync(id)
    const response = await call
    return response.data
  }

  static async update(
    id: string,
    payload: UpdateUserRequest,
  ): Promise<UserResponse> {
    const { call } = helper.updateAsync(id, payload)
    const response = await call
    return response.data
  }

  static async deactivate(id: string): Promise<void> {
    const { call } = helper.deactivateAsync(id)
    await call
  }
}
