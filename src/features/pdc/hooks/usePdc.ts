import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { toast } from "sonner"

import { PdcService, type PdcListParams } from "../services/pdcService"
import type {
  AddProgressPayload,
  CreatePdcPayload,
  UpdatePdcPayload,
  UpsertPdcSubjectPayload,
} from "../types"

const KEY = ["pdc"]

/** The plan being written, blocks and rows included. The form and its preview both read it. */
export function usePdcDetail(id: string | null) {
  return useQuery({
    queryKey: [...KEY, "detail", id ?? ""],
    // `enabled` keeps the query from running without an id, but only the guard proves it here.
    queryFn: () => {
      if (!id) throw new Error("Falta el id del PDC")
      return PdcService.getById(id)
    },
    enabled: Boolean(id),
  })
}

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
    mutationFn: (p: CreatePdcPayload) => PdcService.create(p),
    onSuccess: () => {
      toast.success("PDC creado. Ahora completa cada materia.")
      invalidate()
    },
  })
}

export function useUpdatePdc() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (v: { id: string; payload: UpdatePdcPayload }) =>
      PdcService.update(v.id, v.payload),
    onSuccess: () => {
      toast.success("Datos generales guardados.")
      invalidate()
    },
  })
}

/**
 * Saves the subject step the teacher is on. The server answers with the whole plan, so it is
 * written straight into the detail cache: the preview and the remaining steps then read the same
 * plan the server holds, without a refetch that could land on top of the next step being typed.
 */
export function useWritePdcSubject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: {
      id: string
      planSubjectId: string
      payload: UpsertPdcSubjectPayload
    }) => PdcService.writeSubject(v.id, v.planSubjectId, v.payload),
    onSuccess: (plan) => {
      toast.success("Materia guardada.")
      qc.setQueryData([...KEY, "detail", plan.id], plan)
      // The block write returns the whole plan, so the detail is already fresh above. Only the
      // listing needs refetching — its rows carry the status and the subjects a write can change.
      void qc.invalidateQueries({
        predicate: (q) =>
          q.queryKey[0] === KEY[0] &&
          q.queryKey[1] !== "detail" &&
          q.queryKey[1] !== "progress",
      })
    },
  })
}

export function useCopyPdcToParallels() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (id: string) => PdcService.copyToParallels(id),
    onSuccess: (copies) => {
      toast.success(
        copies.length === 0
          ? "Los otros paralelos ya tenían su plan de este mes."
          : `Copiado a ${copies.length} paralelo${copies.length === 1 ? "" : "s"}.`,
      )
      invalidate()
    },
  })
}

export function usePdcProgress(id: string | null) {
  return useQuery({
    queryKey: ["pdc", "progress", id ?? ""],
    queryFn: () => {
      if (!id) throw new Error("Falta el id del PDC")
      return PdcService.listProgress(id)
    },
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
