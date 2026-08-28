import { Fragment } from "react"

import { cn } from "@/lib/utils"

import type { Pdc, PdcSubject } from "../types"

const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
]

const ORDINAL: Record<number, string> = { 1: "Primer", 2: "Segundo", 3: "Tercer" }

/** "03 de agosto" — the form spells the month out rather than printing a numeric date. */
function spellDate(iso: string | null): string {
  if (!iso) return "…"
  const [year, month, day] = iso.split("-").map(Number)
  if (!year || !month || !day) return "…"
  return `${String(day).padStart(2, "0")} de ${MONTHS[month - 1]}`
}

/** Blank slots read as the form's own dotted line, so an empty plan still looks like the form. */
function orBlank(value: string | null | undefined) {
  return value && value.trim() !== "" ? value : "…"
}

/**
 * Groups the blocks the way the form prints them: by area, keeping the plan's own order. An area
 * gets one group however scattered its subjects are — a block added after the plan was opened is
 * appended at the end, so the areas do not arrive in runs, and one group per run would print the
 * same heading twice.
 */
function byKnowledgeArea(subjects: PdcSubject[]) {
  const groups = new Map<string, PdcSubject[]>()
  for (const subject of [...subjects].sort((a, b) => a.displayOrder - b.displayOrder)) {
    const area = subject.knowledgeArea ?? "Sin área"
    const group = groups.get(area)
    if (group) group.push(subject)
    else groups.set(area, [subject])
  }
  return [...groups].map(([area, grouped]) => ({ area, subjects: grouped }))
}

export interface PdcPreviewProps {
  plan: Pdc
  /** Highlights the block being edited, so the teacher sees where their typing lands. */
  activeSubjectId?: string | null
}

/**
 * The plan as it will be handed in. It renders whatever the plan holds right now, so the teacher
 * watches the document take shape instead of guessing what the form adds up to.
 */
export function PdcPreview({ plan, activeSubjectId }: PdcPreviewProps) {
  const areas = byKnowledgeArea(plan.subjects)

  return (
    <article className="flex min-w-0 flex-col gap-5 rounded-md border bg-card p-6 text-[13px] leading-relaxed">
      <header className="flex flex-col items-center gap-1 text-center">
        <p className="text-[11px] font-semibold tracking-wide text-muted-foreground">
          MINISTERIO DE EDUCACIÓN · DIRECCIÓN DISTRITAL DE EDUCACIÓN SACABA
        </p>
        <p className="text-[11px] font-semibold tracking-wide text-muted-foreground">
          UNIDAD EDUCATIVA “6 DE JUNIO” · EDUCACIÓN PRIMARIA COMUNITARIA VOCACIONAL
        </p>
        <h2 className="mt-1 text-base font-bold">
          PLAN DE DESARROLLO CURRICULAR Nº {plan.planNumber}
        </h2>
      </header>

      <section className="flex flex-col gap-2">
        <h3 className="font-bold">1. DATOS REFERENCIALES</h3>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          <dt className="font-semibold">Año de escolaridad</dt>
          <dd>{orBlank(plan.courseName)}</dd>
          <dt className="font-semibold">Maestro/a</dt>
          <dd>{orBlank(plan.homeroomTeacherName)}</dd>
          <dt className="font-semibold">Áreas</dt>
          <dd>
            {plan.subjects.length === 0
              ? "…"
              : plan.subjects.map((s) => s.subjectName).join("; ")}
          </dd>
          <dt className="font-semibold">Trimestre</dt>
          <dd>{ORDINAL[plan.trimester] ?? plan.trimester}</dd>
          <dt className="font-semibold">Periodo</dt>
          <dd>
            Del: {spellDate(plan.periodStart)} al: {spellDate(plan.periodEnd)}
          </dd>
        </dl>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-bold">2. DESARROLLO</h3>
        <div>
          <p className="font-semibold">Objetivo holístico de nivel</p>
          <p className="whitespace-pre-wrap text-muted-foreground">
            {orBlank(plan.holisticObjective)}
          </p>
        </div>
      </section>

      {areas.map((group) => (
        <section key={group.area} className="flex flex-col gap-3">
          <h4 className="font-bold">
            Área de saberes y conocimiento: {group.area}
          </h4>
          {group.subjects.map((subject) => (
            <div
              key={subject.id}
              className={cn(
                "flex flex-col gap-2 rounded-md border p-3",
                subject.id === activeSubjectId && "border-univalle bg-univalle/5",
              )}
            >
              <p className="font-semibold">{subject.subjectName}</p>
              <p>
                <span className="font-semibold">Objetivo de aprendizaje: </span>
                <span className="whitespace-pre-wrap text-muted-foreground">
                  {orBlank(subject.learningObjective)}
                </span>
              </p>

              {subject.entries.length === 0 ? (
                <p className="text-muted-foreground italic">
                  Sin semanas cargadas todavía.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[52rem] border-collapse text-[12px]">
                    <thead>
                      <tr className="bg-muted/60">
                        <th className="border px-2 py-1 text-left font-semibold">Contenidos</th>
                        <th className="border px-2 py-1 text-left font-semibold">
                          Momentos del proceso formativo
                        </th>
                        <th className="border px-2 py-1 text-left font-semibold">Recursos</th>
                        <th className="border px-2 py-1 text-left font-semibold">Per.</th>
                        <th className="border px-2 py-1 text-left font-semibold">
                          Criterios de evaluación
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...subject.entries]
                        .sort((a, b) => a.displayOrder - b.displayOrder)
                        .map((entry) => (
                          <tr key={entry.id} className="align-top">
                            <td className="border px-2 py-1">
                              <span className="font-semibold">{entry.weekLabel}</span>
                              <span className="block whitespace-pre-wrap text-muted-foreground">
                                {orBlank(entry.contents)}
                              </span>
                            </td>
                            <td className="border px-2 py-1">
                              {(
                                [
                                  ["PRÁCTICA", entry.practice],
                                  ["TEORÍA", entry.theory],
                                  ["VALORACIÓN", entry.valuation],
                                  ["PRODUCCIÓN", entry.production],
                                ] as const
                              ).map(([label, value]) => (
                                <Fragment key={label}>
                                  <span className="font-semibold">● {label}: </span>
                                  <span className="whitespace-pre-wrap text-muted-foreground">
                                    {orBlank(value)}
                                  </span>
                                  <br />
                                </Fragment>
                              ))}
                            </td>
                            <td className="border px-2 py-1 whitespace-pre-wrap text-muted-foreground">
                              {orBlank(entry.resources)}
                            </td>
                            <td className="border px-2 py-1 text-center">
                              {entry.periods ?? "—"}
                            </td>
                            <td className="border px-2 py-1">
                              {(
                                [
                                  ["SER", entry.criteriaBeing],
                                  ["SABER", entry.criteriaKnowing],
                                  ["HACER", entry.criteriaDoing],
                                  ["DECIDIR", entry.criteriaDeciding],
                                ] as const
                              ).map(([label, value]) =>
                                value && value.trim() !== "" ? (
                                  <Fragment key={label}>
                                    <span className="font-semibold">{label}: </span>
                                    <span className="whitespace-pre-wrap text-muted-foreground">
                                      {value}
                                    </span>
                                    <br />
                                  </Fragment>
                                ) : null,
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}

              {subject.generalAdaptations ? (
                <div>
                  <p className="font-semibold">ADAPTACIONES CURRICULARES.</p>
                  <p className="whitespace-pre-wrap text-muted-foreground">
                    {subject.generalAdaptations}
                  </p>
                </div>
              ) : null}
            </div>
          ))}
        </section>
      ))}

      <section className="flex flex-col gap-2">
        <h3 className="font-bold">
          3. PRODUCTO FINAL DEL MES
        </h3>
        <p className="whitespace-pre-wrap text-muted-foreground">
          {orBlank(plan.finalProduct)}
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-bold">BIBLIOGRAFÍA</h3>
        <p className="whitespace-pre-wrap text-muted-foreground">
          {orBlank(plan.bibliography)}
        </p>
      </section>

      <footer className="mt-4 grid grid-cols-2 gap-8 text-center text-[12px] text-muted-foreground">
        <p className="border-t pt-1">Firma del Maestro/a</p>
        <p className="border-t pt-1">Sello y Firma del Director</p>
      </footer>
    </article>
  )
}
