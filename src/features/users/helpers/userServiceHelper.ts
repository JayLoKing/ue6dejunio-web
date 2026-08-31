import type { UseApiCall } from "@/lib/useApicall"
import { loadAbort } from "@/lib/loadAbort"
import { httpClient } from "@/lib/axios"

import { UserUrl } from "./userServicePath"
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

export default class UserServiceHelper {
  createAsync(payload: CreateUserRequest): UseApiCall<UserResponse> {
    const controller = loadAbort()
    return {
      call: httpClient.post<UserResponse>(UserUrl.Base, payload, {
        signal: controller.signal,
      }),
      controller,
    }
  }

  listAsync(query: ListUsersQuery): UseApiCall<PagedResponse<UsersListItem>> {
    const controller = loadAbort()
    return {
      call: httpClient.get<PagedResponse<UsersListItem>>(UserUrl.Base, {
        params: query,
        signal: controller.signal,
      }),
      controller,
    }
  }

  getByIdAsync(id: string): UseApiCall<UserResponse> {
    const controller = loadAbort()
    return {
      call: httpClient.get<UserResponse>(UserUrl.ById(id), {
        signal: controller.signal,
      }),
      controller,
    }
  }

  updateAsync(
    id: string,
    payload: UpdateUserRequest
  ): UseApiCall<UserResponse> {
    const controller = loadAbort()
    return {
      call: httpClient.put<UserResponse>(UserUrl.ById(id), payload, {
        signal: controller.signal,
      }),
      controller,
    }
  }

  deactivateAsync(id: string): UseApiCall<void> {
    const controller = loadAbort()
    return {
      call: httpClient.delete<void>(UserUrl.ById(id), {
        signal: controller.signal,
      }),
      controller,
    }
  }
}
