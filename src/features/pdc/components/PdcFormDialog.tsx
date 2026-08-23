import { useEffect } from "react"
import { useForm, Controller, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { trimmedString } from "@/lib/validation/rules"
import type { TeacherSubject } from "@/features/students/hooks/useTeacherStudents"

import { useCreatePdc, useUpdatePdc } from "../hooks/usePdc"
import type { Pdc } from "../types"

const schema = z.object({
  classGroupId: z.string().min(1, "Selecciona materia"),
  trimester: z.coerce.number().int().min(1).max(3),
  title: trimmedString({ min: 1, max: 200, field: "Título" }),
  holisticObjective: z.string().optional(),
  learningObjective: z.string().optional(),
  contents: z.string().optional(),
  practiceActivities: z.string().optional(),
  theoryActivities: z.string().optional(),
  valuationActivities: z.string().optional(),
  productionActivities: z.string().optional(),
  resources: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  criteriaBeing: z.string().optional(),
  criteriaKnowing: z.string().optional(),
  criteriaDoing: z.string().optional(),
  criteriaDeciding: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

const EMPTY: FormValues = {
  classGroupId: "",
  trimester: 1,
  title: "",
  holisticObjective: "",
  learningObjective: "",
  contents: "",
  practiceActivities: "",
  theoryActivities: "",
  valuationActivities: "",
  productionActivities: "",
  resources: "",
  startDate: "",
  endDate: "",
  criteriaBeing: "",
  criteriaKnowing: "",
  criteriaDoing: "",
  criteriaDeciding: "",
}

export interface PdcFormDialogProps {
  open: boolean
  editing: Pdc | null
  subjects: TeacherSubject[]
  onClose: () => void
}

export function PdcFormDialog({
  open,
  editing,
  subjects,
  onClose,
}: PdcFormDialogProps) {
  const create = useCreatePdc()
  const update = useUpdatePdc()
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: EMPTY,
  })

  useEffect(() => {
    if (!open) return
    if (editing) {
      reset({
        classGroupId: editing.classGroupId,
        trimester: editing.trimester,
        title: editing.title,
        holisticObjective: editing.holisticObjective ?? "",
        learningObjective: editing.learningObjective ?? "",
        contents: editing.contents ?? "",
        practiceActivities: editing.practiceActivities ?? "",
        theoryActivities: editing.theoryActivities ?? "",
        valuationActivities: editing.valuationActivities ?? "",
        productionActivities: editing.productionActivities ?? "",
        resources: editing.resources ?? "",
        startDate: editing.startDate ?? "",
        endDate: editing.endDate ?? "",
        criteriaBeing: editing.criteriaBeing ?? "",
        criteriaKnowing: editing.criteriaKnowing ?? "",
        criteriaDoing: editing.criteriaDoing ?? "",
        criteriaDeciding: editing.criteriaDeciding ?? "",
      })
    } else {
      reset({ ...EMPTY, classGroupId: subjects[0]?.classGroupId ?? "" })
    }
  }, [open, editing, subjects, reset])

  const onSubmit = handleSubmit(async (v) => {
    const body = {
      title: v.title,
      holisticObjective: v.holisticObjective || undefined,
      learningObjective: v.learningObjective || undefined,
      contents: v.contents || undefined,
      practiceActivities: v.practiceActivities || undefined,
      theoryActivities: v.theoryActivities || undefined,
      valuationActivities: v.valuationActivities || undefined,
      productionActivities: v.productionActivities || undefined,
      resources: v.resources || undefined,
      startDate: v.startDate || undefined,
      endDate: v.endDate || undefined,
      criteriaBeing: v.criteriaBeing || undefined,
      criteriaKnowing: v.criteriaKnowing || undefined,
      criteriaDoing: v.criteriaDoing || undefined,
      criteriaDeciding: v.criteriaDeciding || undefined,
    }
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, payload: body })
      } else {
        await create.mutateAsync({
          id_class_group: v.classGroupId,
          trimester: v.trimester,
          ...body,
        })
      }
      onClose()
    } catch {
      /* toast via interceptor */
    }
  })

  const saving = create.isPending || update.isPending

  const textArea = (name: keyof FormValues, label: string) => (
    <Field>
      <FieldLabel htmlFor={`pdc-${name}`}>{label}</FieldLabel>
      <Textarea id={`pdc-${name}`} rows={2} {...register(name)} />
    </Field>
  )

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar PDC" : "Nuevo PDC"}</DialogTitle>
          <DialogDescription>
            Plan de Desarrollo Curricular por materia y trimestre.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Controller
              control={control}
              name="classGroupId"
              render={({ field }) => (
                <Field data-invalid={Boolean(errors.classGroupId) || undefined}>
                  <FieldLabel htmlFor="pdc-cg">Materia</FieldLabel>
                  <Select
                    value={field.value || undefined}
                    onValueChange={field.onChange}
                    disabled={Boolean(editing)}
                  >
                    <SelectTrigger id="pdc-cg">
                      <SelectValue placeholder="Materia" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((s) => (
                        <SelectItem key={s.classGroupId} value={s.classGroupId}>
                          {s.subjectName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.classGroupId ? (
                    <FieldError>{errors.classGroupId.message}</FieldError>
                  ) : null}
                </Field>
              )}
            />
            <Controller
              control={control}
              name="trimester"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="pdc-tri">Trimestre</FieldLabel>
                  <Select
                    value={String(field.value)}
                    onValueChange={(v) => field.onChange(Number(v))}
                    disabled={Boolean(editing)}
                  >
                    <SelectTrigger id="pdc-tri">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1ro</SelectItem>
                      <SelectItem value="2">2do</SelectItem>
                      <SelectItem value="3">3ro</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
          </div>

          <Field data-invalid={Boolean(errors.title) || undefined}>
            <FieldLabel htmlFor="pdc-title">Título</FieldLabel>
            <Input id="pdc-title" {...register("title")} />
            {errors.title ? <FieldError>{errors.title.message}</FieldError> : null}
          </Field>

          {textArea("holisticObjective", "Objetivo holístico")}
          {textArea("learningObjective", "Objetivo de aprendizaje")}
          {textArea("contents", "Contenidos")}

          <div className="grid grid-cols-2 gap-4">
            {textArea("practiceActivities", "Actividades de práctica")}
            {textArea("theoryActivities", "Actividades de teoría")}
            {textArea("valuationActivities", "Actividades de valoración")}
            {textArea("productionActivities", "Actividades de producción")}
          </div>

          {textArea("resources", "Recursos")}

          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="pdc-start">Inicio</FieldLabel>
              <Input id="pdc-start" type="date" {...register("startDate")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="pdc-end">Fin</FieldLabel>
              <Input id="pdc-end" type="date" {...register("endDate")} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {textArea("criteriaBeing", "Criterio SER")}
            {textArea("criteriaKnowing", "Criterio SABER")}
            {textArea("criteriaDoing", "Criterio HACER")}
            {textArea("criteriaDeciding", "Criterio AUTOEVALUACIÓN")}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-univalle text-univalle-foreground hover:bg-univalle/90"
              disabled={saving}
            >
              {saving ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
