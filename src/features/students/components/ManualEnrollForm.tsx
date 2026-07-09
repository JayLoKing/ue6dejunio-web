import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
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

import { studentPayloadSchema } from "../models/schemas/student-schemas"
import { useEnrollSingle } from "../hooks/useEnroll"
import type { StudentPayload } from "../types"

export interface ManualEnrollFormProps {
  courseId: string | null
  onSuccess: () => void
}

export function ManualEnrollForm({ courseId, onSuccess }: ManualEnrollFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StudentPayload>({
    resolver: zodResolver(studentPayloadSchema),
    defaultValues: {
      rudeCode: "",
      identityCard: "",
      names: "",
      lastNames: "",
      birthDate: "",
      gender: "M",
    },
  })

  const enroll = useEnrollSingle()

  const onSubmit = handleSubmit(async (values) => {
    if (!courseId) return
    try {
      await enroll.mutateAsync({ id_course: courseId, student: values })
      onSuccess()
    } catch {
      /* toast via interceptor */
    }
  })

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <FieldGroup>
        <div className="grid grid-cols-2 gap-4">
          <Field data-invalid={Boolean(errors.rudeCode) || undefined}>
            <FieldLabel htmlFor="rudeCode">Codigo RUDE</FieldLabel>
            <Input
              id="rudeCode"
              aria-invalid={Boolean(errors.rudeCode) || undefined}
              {...register("rudeCode")}
            />
            {errors.rudeCode ? (
              <FieldError>{errors.rudeCode.message}</FieldError>
            ) : null}
          </Field>

          <Field data-invalid={Boolean(errors.identityCard) || undefined}>
            <FieldLabel htmlFor="identityCard">Carnet</FieldLabel>
            <Input
              id="identityCard"
              aria-invalid={Boolean(errors.identityCard) || undefined}
              {...register("identityCard")}
            />
            {errors.identityCard ? (
              <FieldError>{errors.identityCard.message}</FieldError>
            ) : null}
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field data-invalid={Boolean(errors.lastNames) || undefined}>
            <FieldLabel htmlFor="lastNames">Apellidos</FieldLabel>
            <Input
              id="lastNames"
              placeholder="Paterno Materno"
              aria-invalid={Boolean(errors.lastNames) || undefined}
              {...register("lastNames")}
            />
            {errors.lastNames ? (
              <FieldError>{errors.lastNames.message}</FieldError>
            ) : null}
          </Field>

          <Field data-invalid={Boolean(errors.names) || undefined}>
            <FieldLabel htmlFor="names">Nombres</FieldLabel>
            <Input
              id="names"
              aria-invalid={Boolean(errors.names) || undefined}
              {...register("names")}
            />
            {errors.names ? (
              <FieldError>{errors.names.message}</FieldError>
            ) : null}
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field data-invalid={Boolean(errors.birthDate) || undefined}>
            <FieldLabel htmlFor="birthDate">Fecha de nacimiento</FieldLabel>
            <Input
              id="birthDate"
              type="date"
              aria-invalid={Boolean(errors.birthDate) || undefined}
              {...register("birthDate")}
            />
            {errors.birthDate ? (
              <FieldError>{errors.birthDate.message}</FieldError>
            ) : null}
          </Field>

          <Field data-invalid={Boolean(errors.gender) || undefined}>
            <FieldLabel htmlFor="gender">Genero</FieldLabel>
            <Select
              value={watch("gender")}
              onValueChange={(v) => setValue("gender", v as "M" | "F")}
            >
              <SelectTrigger id="gender">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">Masculino</SelectItem>
                <SelectItem value="F">Femenino</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </FieldGroup>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="submit"
          className="bg-univalle text-univalle-foreground hover:bg-univalle/90"
          disabled={enroll.isPending || !courseId}
        >
          {enroll.isPending ? "Inscribiendo..." : "Inscribir estudiante"}
        </Button>
      </div>
    </form>
  )
}
