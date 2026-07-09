import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { toast } from "sonner"

import { PdcService, type PdcListParams } from "../services/pdcService"
import type { AddProgressPayload, PdcFormPayload } from "../types"

const KEY = ["pdc"]

export function usePdcList(params: PdcListParams) {
  return useQuery({
    queryKey: [...KEY, params],
    queryFn: () => PdcService.list(params),
    placeholderData: keepPreviousData,
  })
}

function useInvalidate() {
  const qc = useQueryClient()
  return () => void qc.invalidateQueries({ queryKey: KEY })
}

export function useCreatePdc() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (p: PdcFormPayload) => PdcService.create(p),
    onSuccess: () => {
      toast.success("PDC creado.")
      invalidate()
    },
  })
}

export function useUpdatePdc() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (v: {
      id: string
      payload: Omit<PdcFormPayload, "id_class_group" | "trimester">
    }) => PdcService.update(v.id, v.payload),
    onSuccess: () => {
      toast.success("PDC actualizado.")
      invalidate()
    },
  })
}

export function usePdcProgress(id: string | null) {
  return useQuery({
    queryKey: ["pdc", "progress", id ?? ""],
    queryFn: () => PdcService.listProgress(id as string),
    enabled: Boolean(id),
  })
}

export function useAddProgress(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (p: AddProgressPayload) => PdcService.addProgress(id, p),
    onSuccess: () => {
      toast.success("Avance registrado.")
      void qc.invalidateQueries({ queryKey: ["pdc", "progress", id] })
    },
  })
}

export function usePdcAction() {
  const invalidate = useInvalidate()
  const publish = useMutation({
    mutationFn: (id: string) => PdcService.publish(id),
    onSuccess: () => {
      toast.success("PDC publicado.")
      invalidate()
    },
  })
  const approve = useMutation({
    mutationFn: (id: string) => PdcService.approve(id),
    onSuccess: () => {
      toast.success("PDC aprobado.")
      invalidate()
    },
  })
  const observe = useMutation({
    mutationFn: (v: { id: string; observations: string }) =>
      PdcService.observe(v.id, v.observations),
    onSuccess: () => {
      toast.success("PDC observado.")
      invalidate()
    },
  })
  const remove = useMutation({
    mutationFn: (id: string) => PdcService.remove(id),
    onSuccess: () => {
      toast.success("PDC eliminado.")
      invalidate()
    },
  })
  return { publish, approve, observe, remove }
}
