import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

import { ClassGroupService } from "../services/classGroupService"
import type { CreateClassGroupRequest } from "../models/requests/create-class-group-request"
import type { CreateClassGroupResponse } from "../models/response/class-group-response"

export function useCreateClassGroup() {
  return useMutation<CreateClassGroupResponse, Error, CreateClassGroupRequest>(
    {
      mutationFn: (payload) => ClassGroupService.create(payload),
      onSuccess: (res) =>
        toast.success(`Curso creado con ${res.length} materia(s).`),
    },
  )
}
