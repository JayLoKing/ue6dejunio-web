import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { isAxiosError } from "axios"
import { Loader2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { useStudentDetail, useUpdateStudent } from "../hooks/useStudent"
import type { UpdateStudentRequest } from "../models/requests/update-student-request"
import {
  updateStudentSchema,
  type StudentEditValues,
} from "../models/schemas/student-schemas"
import type { StudentDetail } from "../types"

export interface EditStudentDialogProps {
  /** El estudiante a editar. Null cierra el diálogo. */
  studentId: string | null
  onClose: () => void
}

/**
 * Corregir o completar los datos de un estudiante: lo que la planilla de la escuela dejó vacío, o
 * lo que se cargó mal. Quien lo llama decide si ofrecerlo (Director, o el docente de aula del curso).
 *
 * La ficha se pide al abrir, porque los listados no traen la fecha ni el género. El formulario se
 * monta con `key` por estudiante para que lo escrito para uno no quede puesto al abrir el siguiente.
 */
export function EditStudentDialog({
  studentId,
  onClose,
}: EditStudentDialogProps) {
  const student = useStudentDetail(studentId)

  return (
    <Dialog open={Boolean(studentId)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar datos del estudiante</DialogTitle>
          <DialogDescription>
            RUDE, carnet, fecha de nacimiento y género pueden quedar vacíos si
            todavía no los tienes.
          </DialogDescription>
        </DialogHeader>

        {student.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2Icon className="size-4 animate-spin" />
            Cargando datos...
          </div>
        ) : student.isError || !student.data ? (
          <p className="text-sm text-destructive">
            No se pudieron cargar los datos del estudiante.
          </p>
        ) : (
          <EditStudentForm
            key={student.data.id}
            student={student.data}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

/** Sentinela del Select: Radix no admite un ítem con valor vacío, y "" es lo que lo limpia. */
const NO_GENDER = "none"

const toValues = (s: StudentDetail): StudentEditValues => ({
  rudeCode: s.rudeCode ?? "",
  identityCard: s.identityCard ?? "",
  names: s.names,
  lastNames: s.lastNames,
  birthDate: s.birthDate ?? "",
  gender: s.gender ?? "",
})

/** La ficha entera, con cada opcional vacío como null: la API reemplaza, no completa. */
const toRequest = (v: StudentEditValues): UpdateStudentRequest => ({
  rudeCode: v.rudeCode || null,
  identityCard: v.identityCard || null,
  names: v.names,
  lastNames: v.lastNames,
  birthDate: v.birthDate || null,
  gender: v.gender || null,
})

/** El mensaje de un 409 (RUDE o carnet de otro estudiante), para dejarlo junto al formulario. */
const conflictMessage = (e: unknown): string | null => {
  if (!isAxiosError(e) || e.response?.status !== 409) return null
  const data: unknown = e.response.data
  if (data && typeof data === "object" && "message" in data) {
    const message = (data as { message?: unknown }).message
    if (typeof message === "string" && message.trim()) return message
  }
  return "El RUDE o el carnet ya pertenecen a otro estudiante."
}

interface EditStudentFormProps {
  student: StudentDetail
  onClose: () => void
}

function EditStudentForm({ student, onClose }: EditStudentFormProps) {
  const update = useUpdateStudent()
  const [conflict, setConflict] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<StudentEditValues>({
    mode: "onTouched",
    resolver: zodResolver(updateStudentSchema),
    defaultValues: toValues(student),
  })

  const onSubmit = handleSubmit(async (values) => {
    setConflict(null)
    try {
      await update.mutateAsync({ id: student.id, payload: toRequest(values) })
      onClose()
    } catch (e) {
      // El interceptor ya mostró el aviso; un 409 además queda escrito junto al dato a corregir.
      setConflict(conflictMessage(e))
    }
  })

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <FieldGroup>
        <div className="grid grid-cols-2 gap-4">
          <Field data-invalid={Boolean(errors.lastNames) || undefined}>
            <FieldLabel htmlFor="edit-lastNames">Apellidos</FieldLabel>
            <Input
              id="edit-lastNames"
              aria-invalid={Boolean(errors.lastNames) || undefined}
              {...register("lastNames")}
            />
            {errors.lastNames ? (
              <FieldError>{errors.lastNames.message}</FieldError>
            ) : null}
          </Field>

          <Field data-invalid={Boolean(errors.names) || undefined}>
            <FieldLabel htmlFor="edit-names">Nombres</FieldLabel>
            <Input
              id="edit-names"
              aria-invalid={Boolean(errors.names) || undefined}
              {...register("names")}
            />
            {errors.names ? (
              <FieldError>{errors.names.message}</FieldError>
            ) : null}
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field data-invalid={Boolean(errors.rudeCode) || undefined}>
            <FieldLabel htmlFor="edit-rudeCode">Código RUDE</FieldLabel>
            <Input
              id="edit-rudeCode"
              aria-invalid={Boolean(errors.rudeCode) || undefined}
              {...register("rudeCode")}
            />
            {errors.rudeCode ? (
              <FieldError>{errors.rudeCode.message}</FieldError>
            ) : null}
          </Field>

          <Field data-invalid={Boolean(errors.identityCard) || undefined}>
            <FieldLabel htmlFor="edit-identityCard">Carnet</FieldLabel>
            <Input
              id="edit-identityCard"
              aria-invalid={Boolean(errors.identityCard) || undefined}
              {...register("identityCard")}
            />
            {errors.identityCard ? (
              <FieldError>{errors.identityCard.message}</FieldError>
            ) : null}
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field data-invalid={Boolean(errors.birthDate) || undefined}>
            <FieldLabel htmlFor="edit-birthDate">
              Fecha de nacimiento
            </FieldLabel>
            <Input
              id="edit-birthDate"
              type="date"
              aria-invalid={Boolean(errors.birthDate) || undefined}
              {...register("birthDate")}
            />
            {errors.birthDate ? (
              <FieldError>{errors.birthDate.message}</FieldError>
            ) : null}
          </Field>

          <Field data-invalid={Boolean(errors.gender) || undefined}>
            <FieldLabel htmlFor="edit-gender">Género</FieldLabel>
            <Controller
              control={control}
              name="gender"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) =>
                    field.onChange(v === NO_GENDER ? "" : v)
                  }
                >
                  <SelectTrigger id="edit-gender">
                    <SelectValue placeholder="Sin especificar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculino</SelectItem>
                    <SelectItem value="F">Femenino</SelectItem>
                    <SelectItem value={NO_GENDER}>Sin especificar</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.gender ? (
              <FieldError>{errors.gender.message}</FieldError>
            ) : null}
          </Field>
        </div>
      </FieldGroup>

      {conflict ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {conflict}
        </div>
      ) : null}

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={update.isPending}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={update.isPending}>
          {update.isPending ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : null}
          Guardar
        </Button>
      </DialogFooter>
    </form>
  )
}
