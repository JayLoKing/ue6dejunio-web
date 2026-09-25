import { useMemo, useState } from "react"
import { CheckIcon, Loader2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useInstitution } from "@/features/institution/hooks/useInstitution"
import { useCourseStudents } from "@/features/courses/hooks/useCourses"
import { AdaptationsStep } from "@/features/adaptation/components/AdaptationsStep"
import {
  useAdaptationList,
  useCreateAdaptation,
  useDeleteAdaptation,
  useUpdateAdaptation,
} from "@/features/adaptation/hooks/useAdaptations"

import {
  usePdcAction,
  usePdcDetail,
  useUpdatePdc,
  useWritePdcSubject,
} from "../hooks/usePdc"
import { PdcDocumentPanel } from "./PdcDocumentPanel"
import { PdcSubjectStep } from "./PdcSubjectStep"
import type { Pdc, UpdatePdcPayload } from "../types"
import { DEFAULT_HOLISTIC_OBJECTIVE } from "../utils/holisticObjective"
import { isEditable } from "../utils/status"
import { trimmed } from "@/lib/trimmed"

/**
 * The steps of the form, in the order the paper plan is filled: the heading once, then one step
 * per subject, then the closing sections. The heading is shared, which is why it is asked for
 * before the subjects rather than repeated inside each one.
 */
type Step =
  | { kind: "general" }
  | { kind: "subject"; index: number }
  | { kind: "adaptations" }
  | { kind: "closing" }
  | { kind: "review" }

function stepsOf(plan: Pdc): Step[] {
  return [
    { kind: "general" },
    ...plan.subjects.map((_, index) => ({ kind: "subject", index }) as const),
    // Where the document puts them: after the subject tables and before what closes the month.
    { kind: "adaptations" },
    { kind: "closing" },
    { kind: "review" },
  ]
}

function labelOf(step: Step, plan: Pdc): string {
  switch (step.kind) {
    case "general":
      return "Datos generales"
    case "subject":
      return plan.subjects[step.index]?.subjectName ?? "Materia"
    case "adaptations":
      return "Adaptaciones"
    case "closing":
      return "Cierre"
    case "review":
      return "Revisar"
  }
}

/** The whole roster in one page: a course is thirty-odd children, and the step lists them all. */
const WHOLE_ROSTER = { offset: 1, limit: 200, sort: "asc" } as const

export interface PdcWizardProps {
  planId: string
  onClose: () => void
}

export function PdcWizard({ planId, onClose }: PdcWizardProps) {
  const detail = usePdcDetail(planId)
  const institution = useInstitution()
  const updatePlan = useUpdatePdc()
  const writeSubject = useWritePdcSubject()
  const { publish } = usePdcAction()
  const adaptations = useAdaptationList(planId)
  const addAdaptation = useCreateAdaptation(planId)
  const editAdaptation = useUpdateAdaptation(planId)
  const removeAdaptation = useDeleteAdaptation(planId)
  const [current, setCurrent] = useState(0)

  const plan = detail.data
  const roster = useCourseStudents(plan?.courseId, WHOLE_ROSTER)
  const written = adaptations.data?.content ?? []
  const steps = useMemo(() => (plan ? stepsOf(plan) : []), [plan])

  if (detail.isLoading || !plan) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2Icon className="size-4 animate-spin" /> Cargando el plan…
      </div>
    )
  }

  const step = steps[current] ?? steps[0]
  const editable = isEditable(plan.status)
  const goNext = () => setCurrent((i) => Math.min(i + 1, steps.length - 1))
  const goBack = () => setCurrent((i) => Math.max(i - 1, 0))

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {plan.reviewObservations ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm">
          <p className="font-semibold text-destructive">
            Observaciones del Director
          </p>
          <p className="whitespace-pre-wrap">{plan.reviewObservations}</p>
        </div>
      ) : null}

      <ol className="flex flex-wrap gap-2">
        {steps.map((s, index) => (
          <li key={`${s.kind}-${index}`}>
            <button
              type="button"
              onClick={() => setCurrent(index)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                index === current
                  ? "border-brand bg-brand text-brand-foreground"
                  : "text-muted-foreground hover:border-brand/40"
              )}
            >
              {index + 1}. {labelOf(s, plan)}
            </button>
          </li>
        ))}
      </ol>

      <div className="grid min-w-0 gap-6 xl:grid-cols-2">
        <section className="min-w-0">
          {step.kind === "general" ? (
            <GeneralStep
              plan={plan}
              saving={updatePlan.isPending}
              onSave={(payload) =>
                updatePlan.mutate(
                  { id: plan.id, payload },
                  { onSuccess: goNext }
                )
              }
              onCancel={onClose}
            />
          ) : null}

          {step.kind === "subject" ? (
            <PdcSubjectStep
              // Keyed by the block so moving on starts from that subject's own saved state.
              key={plan.subjects[step.index].id}
              subject={plan.subjects[step.index]}
              saving={writeSubject.isPending}
              backLabel="Anterior"
              nextLabel={
                step.index === plan.subjects.length - 1
                  ? "Guardar y cerrar plan"
                  : `Guardar y seguir con ${plan.subjects[step.index + 1].subjectName}`
              }
              onBack={goBack}
              onSave={(payload) =>
                writeSubject.mutate(
                  {
                    id: plan.id,
                    planSubjectId: plan.subjects[step.index].id,
                    payload,
                  },
                  { onSuccess: goNext }
                )
              }
            />
          ) : null}

          {step.kind === "adaptations" ? (
            <AdaptationsStep
              planId={plan.id}
              students={roster.data?.content ?? []}
              adaptations={written}
              saving={
                addAdaptation.isPending ||
                editAdaptation.isPending ||
                removeAdaptation.isPending
              }
              onAdd={(payload) => addAdaptation.mutate(payload)}
              onUpdate={(change) => editAdaptation.mutate(change)}
              onRemove={(id) => removeAdaptation.mutate(id)}
              onBack={goBack}
              onNext={goNext}
            />
          ) : null}

          {step.kind === "closing" ? (
            <ClosingStep
              plan={plan}
              saving={updatePlan.isPending}
              onBack={goBack}
              onSave={(payload) =>
                updatePlan.mutate(
                  { id: plan.id, payload },
                  { onSuccess: goNext }
                )
              }
            />
          ) : null}

          {step.kind === "review" ? (
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-semibold">Revisar y enviar</h3>
              <p className="text-sm text-muted-foreground">
                Revisa el documento de la derecha. Al publicarlo pasa al
                Director y deja de ser editable hasta que lo apruebe u observe.
              </p>
              <div className="flex justify-between gap-3">
                <Button type="button" variant="outline" onClick={goBack}>
                  Anterior
                </Button>
                <Button
                  type="button"
                  className="bg-brand text-brand-foreground hover:bg-brand/90"
                  disabled={!editable || publish.isPending}
                  onClick={() =>
                    publish.mutate(plan.id, { onSuccess: onClose })
                  }
                >
                  <CheckIcon className="size-4" />
                  {publish.isPending ? "Publicando…" : "Publicar para revisión"}
                </Button>
              </div>
            </div>
          ) : null}
        </section>

        <PdcDocumentPanel
          plan={plan}
          institution={institution.data}
          adaptations={written}
          activeSubjectId={
            step.kind === "subject" ? plan.subjects[step.index].id : null
          }
        />
      </div>
    </div>
  )
}

interface GeneralStepProps {
  plan: Pdc
  saving: boolean
  onSave: (
    payload: Pick<
      UpdatePdcPayload,
      "period_start" | "period_end" | "holisticObjective"
    >
  ) => void
  onCancel: () => void
}

function GeneralStep({ plan, saving, onSave, onCancel }: GeneralStepProps) {
  const [periodStart, setPeriodStart] = useState(plan.periodStart)
  const [periodEnd, setPeriodEnd] = useState(plan.periodEnd)
  // A plan that has not been given an objective starts from the template's own, which is the level's
  // objective and reads the same on every plan of the year.
  const [holisticObjective, setHolisticObjective] = useState(
    plan.holisticObjective ?? DEFAULT_HOLISTIC_OBJECTIVE
  )

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold">Datos generales</h3>
        <p className="text-sm text-muted-foreground">
          Estos datos valen para todas las materias del plan. Se cargan una sola
          vez.
        </p>
      </header>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-md border bg-muted/30 p-3 text-sm">
        <dt className="font-medium">Curso</dt>
        <dd>{plan.courseName ?? "—"}</dd>
        <dt className="font-medium">Maestro/a</dt>
        <dd>{plan.homeroomTeacherName ?? "—"}</dd>
        <dt className="font-medium">Plan Nº</dt>
        <dd>{plan.planNumber}</dd>
        <dt className="font-medium">Trimestre</dt>
        <dd>{plan.trimester}</dd>
      </dl>

      <div className="grid gap-4 md:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="pdc-period-start">Del</FieldLabel>
          <Input
            id="pdc-period-start"
            type="date"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="pdc-period-end">Al</FieldLabel>
          <Input
            id="pdc-period-end"
            type="date"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
          />
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor="pdc-holistic">
          Objetivo holístico de nivel
        </FieldLabel>
        <Textarea
          id="pdc-holistic"
          rows={6}
          value={holisticObjective}
          onChange={(e) => setHolisticObjective(e.target.value)}
        />
      </Field>

      <div className="flex justify-between gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cerrar
        </Button>
        <Button
          type="button"
          className="bg-brand text-brand-foreground hover:bg-brand/90"
          disabled={saving}
          onClick={() =>
            onSave({
              period_start: periodStart,
              period_end: periodEnd,
              holisticObjective: trimmed(holisticObjective),
            })
          }
        >
          {saving
            ? "Guardando…"
            : `Guardar y seguir con ${plan.subjects[0]?.subjectName ?? "las materias"}`}
        </Button>
      </div>
    </div>
  )
}

interface ClosingStepProps {
  plan: Pdc
  saving: boolean
  onSave: (
    payload: Pick<UpdatePdcPayload, "finalProduct" | "bibliography">
  ) => void
  onBack: () => void
}

function ClosingStep({ plan, saving, onSave, onBack }: ClosingStepProps) {
  const [finalProduct, setFinalProduct] = useState(plan.finalProduct ?? "")
  const [bibliography, setBibliography] = useState(plan.bibliography ?? "")

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold">Cierre del plan</h3>
        <p className="text-sm text-muted-foreground">
          Lo que cierra el mes, común a todas las materias.
        </p>
      </header>

      <Field>
        <FieldLabel htmlFor="pdc-final-product">
          Producto final del mes
        </FieldLabel>
        <Textarea
          id="pdc-final-product"
          rows={4}
          value={finalProduct}
          onChange={(e) => setFinalProduct(e.target.value)}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="pdc-bibliography">Bibliografía</FieldLabel>
        <Textarea
          id="pdc-bibliography"
          rows={4}
          value={bibliography}
          onChange={(e) => setBibliography(e.target.value)}
        />
      </Field>

      <div className="flex justify-between gap-3">
        <Button type="button" variant="outline" onClick={onBack}>
          Anterior
        </Button>
        <Button
          type="button"
          className="bg-brand text-brand-foreground hover:bg-brand/90"
          disabled={saving}
          onClick={() =>
            onSave({
              finalProduct: trimmed(finalProduct),
              bibliography: trimmed(bibliography),
            })
          }
        >
          {saving ? "Guardando…" : "Guardar y revisar"}
        </Button>
      </div>
    </div>
  )
}
