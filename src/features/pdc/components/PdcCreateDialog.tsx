import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { useCreatePdc } from "../hooks/usePdc"
import type { Pdc } from "../types"

export interface PdcCreateDialogProps {
  open: boolean
  /** The courses the teacher may plan for. A homeroom teacher usually has one. */
  courses: { id: string; name: string }[]
  onClose: () => void
  /** Handed the plan once it exists, so the caller can walk straight into the steps. */
  onCreated: (plan: Pdc) => void
}

/**
 * Opens a month's plan and nothing more. Everything else — the objective, each subject, the
 * closing — is filled through the steps, because the plan has to exist before its subject blocks
 * can be written into.
 */
export function PdcCreateDialog({
  open,
  courses,
  onClose,
  onCreated,
}: PdcCreateDialogProps) {
  const create = useCreatePdc()
  // The dialog mounts before the courses have been fetched, so the initial state cannot hold the
  // first one. Picked stays empty until the teacher chooses; the fallback answers meanwhile, which
  // is what a teacher with a single course expects to find already selected.
  const [picked, setPicked] = useState("")
  const courseId = picked || (courses[0]?.id ?? "")
  const [trimester, setTrimester] = useState("1")
  const [planNumber, setPlanNumber] = useState("1")
  const [periodStart, setPeriodStart] = useState("")
  const [periodEnd, setPeriodEnd] = useState("")

  const valid =
    courseId !== "" &&
    periodStart !== "" &&
    periodEnd !== "" &&
    periodStart <= periodEnd

  const submit = () =>
    create.mutate(
      {
        id_course: courseId,
        plan_number: Number(planNumber),
        trimester: Number(trimester),
        period_start: periodStart,
        period_end: periodEnd,
      },
      { onSuccess: onCreated }
    )

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo plan del mes</DialogTitle>
          <DialogDescription>
            Se abrirá un bloque por cada materia del curso. Los completas uno
            tras otro, dentro del mismo plan.
          </DialogDescription>
        </DialogHeader>

        <Field>
          <FieldLabel htmlFor="pdc-course">Curso</FieldLabel>
          <Select value={courseId} onValueChange={setPicked}>
            <SelectTrigger id="pdc-course">
              <SelectValue placeholder="Selecciona el curso" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="pdc-trimester">Trimestre</FieldLabel>
            <Select value={trimester} onValueChange={setTrimester}>
              <SelectTrigger id="pdc-trimester">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1ro</SelectItem>
                <SelectItem value="2">2do</SelectItem>
                <SelectItem value="3">3ro</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="pdc-number">Plan Nº</FieldLabel>
            <Input
              id="pdc-number"
              type="number"
              min={1}
              max={12}
              value={planNumber}
              onChange={(e) => setPlanNumber(e.target.value)}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="pdc-start">Del</FieldLabel>
            <Input
              id="pdc-start"
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="pdc-end">Al</FieldLabel>
            <Input
              id="pdc-end"
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
            />
          </Field>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            className="bg-brand text-brand-foreground hover:bg-brand/90"
            disabled={!valid || create.isPending}
            onClick={submit}
          >
            {create.isPending ? "Creando…" : "Crear y completar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
