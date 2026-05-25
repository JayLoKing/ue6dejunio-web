import { useMemo, useState } from "react"
import { SaveIcon, SparklesIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

import {
  DIMENSION_WEIGHTS,
  RISK_META,
  classifyRisk,
  totalFromDraft,
  type ScoreDraft,
  type StudentScoreRow,
  type SubjectArea,
  type Trimester,
} from "../types"
import { useRegisterScore } from "../hooks/useRegisterScore"

type Drafts = Record<string, ScoreDraft>

export interface NotebookManagerProps {
  subjects: SubjectArea[]
  students: StudentScoreRow[]
  initialDrafts?: Record<string, Drafts>
}

const DEFAULT_DRAFT: ScoreDraft = { ser: 0, saber: 0, hacer: 0, auto: 0 }

const DIMENSIONS: Array<{
  key: keyof ScoreDraft
  label: string
  short: string
  max: number
}> = [
    { key: "ser", label: "SER", short: "SER", max: DIMENSION_WEIGHTS.SER },
    {
      key: "saber",
      label: "SABER",
      short: "SABER",
      max: DIMENSION_WEIGHTS.SABER,
    },
    {
      key: "hacer",
      label: "HACER",
      short: "HACER",
      max: DIMENSION_WEIGHTS.HACER,
    },
    { key: "auto", label: "DECIDIR / AUTO", short: "AUTO", max: DIMENSION_WEIGHTS.AUTO },
  ]

const clampNumeric = (raw: string, max: number): number => {
  if (raw === "") return 0
  const n = Number(raw)
  if (!Number.isFinite(n)) return 0
  if (n < 0) return 0
  if (n > max) return max
  return Number(n.toFixed(2))
}

export function NotebookManager({
  subjects,
  students,
  initialDrafts,
}: NotebookManagerProps) {
  const [activeSubject, setActiveSubject] = useState<string>(
    subjects[0]?.id ?? "",
  )
  const [trimester, setTrimester] = useState<Trimester>(1)
  const [drafts, setDrafts] = useState<Record<string, Drafts>>(
    initialDrafts ?? {},
  )

  const register = useRegisterScore()

  const subjectKey = `${activeSubject}::T${trimester}`
  const subjectDrafts: Drafts = drafts[subjectKey] ?? {}

  // students enrolled in active subject
  const enrolledStudents = useMemo(
    () =>
      students.filter((s) =>
        Boolean(s.enrollmentsBySubject[activeSubject]),
      ),
    [students, activeSubject],
  )

  const totals = useMemo(() => {
    const map = new Map<string, number>()
    enrolledStudents.forEach((s) => {
      const enrollmentId = s.enrollmentsBySubject[activeSubject]
      const d = subjectDrafts[enrollmentId] ?? DEFAULT_DRAFT
      map.set(enrollmentId, totalFromDraft(d))
    })
    return map
  }, [enrolledStudents, activeSubject, subjectDrafts])

  const updateCell = (
    enrollmentId: string,
    key: keyof ScoreDraft,
    raw: string,
  ) => {
    const dim = DIMENSIONS.find((d) => d.key === key)!
    const value = clampNumeric(raw, dim.max)
    setDrafts((prev) => {
      const current =
        prev[subjectKey]?.[enrollmentId] ?? { ...DEFAULT_DRAFT }
      return {
        ...prev,
        [subjectKey]: {
          ...(prev[subjectKey] ?? {}),
          [enrollmentId]: { ...current, [key]: value },
        },
      }
    })
  }

  const handleSave = (row: StudentScoreRow) => {
    const enrollmentId = row.enrollmentsBySubject[activeSubject]
    if (!enrollmentId) return
    const d = subjectDrafts[enrollmentId] ?? DEFAULT_DRAFT
    register.mutate({
      id_enrollment: enrollmentId,
      trimester,
      scoreBeing: d.ser,
      scoreKnowing: d.saber,
      scoreDoing: d.hacer,
      scoreDeciding: d.auto,
    })
  }

  if (subjects.length === 0) {
    return (
      <div className="rounded-md border bg-card p-6 text-center text-muted-foreground">
        Sin areas curriculares asignadas.
      </div>
    )
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs
          value={activeSubject}
          onValueChange={setActiveSubject}
          className="w-full lg:w-auto"
        >
          <ScrollArea className="max-w-full">
            <TabsList className="flex w-max gap-1" variant="line">
              {subjects.map((s) => (
                <TabsTrigger
                  key={s.id}
                  value={s.id}
                  className="data-[state=active]:bg-univalle data-[state=active]:text-univalle-foreground"
                >
                  {s.name}
                </TabsTrigger>
              ))}
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </Tabs>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Trimestre</span>
          <Select
            value={String(trimester)}
            onValueChange={(v) => setTrimester(Number(v) as Trimester)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1ro</SelectItem>
              <SelectItem value="2">2do</SelectItem>
              <SelectItem value="3">3ro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="min-w-0 overflow-hidden rounded-md border bg-card">
        <ScrollArea className="w-full whitespace-nowrap">
          <table className="w-max border-collapse text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-20 min-w-[18rem] border-r border-b bg-muted px-3 py-2 text-left font-medium shadow-[2px_0_0_0_var(--border)]">
                    Estudiante
                  </th>
                  {DIMENSIONS.map((d) => (
                    <th
                      key={d.key}
                      className="min-w-28 border-r px-3 py-2 text-center font-medium"
                    >
                      <div className="flex flex-col leading-tight">
                        <span>{d.label}</span>
                        <span className="text-xs font-normal text-muted-foreground">
                          /{d.max}
                        </span>
                      </div>
                    </th>
                  ))}
                  <th className="min-w-24 border-r bg-univalle/10 px-3 py-2 text-center font-semibold text-univalle">
                    TOTAL
                  </th>
                  <th className="min-w-44 border-r px-3 py-2 text-center font-medium">
                    <div className="flex items-center justify-center gap-1.5">
                      <SparklesIcon className="size-3.5" />
                      Alerta ML
                    </div>
                  </th>
                  <th className="min-w-24 px-3 py-2 text-center font-medium">
                    Accion
                  </th>
                </tr>
              </thead>
              <tbody>
                {enrolledStudents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={DIMENSIONS.length + 4}
                      className="px-3 py-6 text-center text-muted-foreground"
                    >
                      Sin estudiantes inscritos en esta area.
                    </td>
                  </tr>
                ) : (
                  enrolledStudents.map((s, idx) => {
                    const enrollmentId = s.enrollmentsBySubject[activeSubject]
                    const draft =
                      subjectDrafts[enrollmentId] ?? DEFAULT_DRAFT
                    const total = totals.get(enrollmentId) ?? 0
                    const risk = classifyRisk(total)
                    const meta = RISK_META[risk]
                    const rowBg = idx % 2 === 0 ? "bg-card" : "bg-muted"
                    return (
                      <tr key={s.studentId} className="border-t">
                        <td
                          className={cn(
                            "sticky left-0 z-10 min-w-[18rem] border-r px-3 py-2 shadow-[2px_0_0_0_var(--border)]",
                            rowBg,
                          )}
                        >
                          <div className="flex flex-col leading-tight">
                            <span className="font-medium">{s.fullName}</span>
                            <span className="font-mono text-xs text-muted-foreground">
                              RUDE {s.rudeCode}
                            </span>
                          </div>
                        </td>
                        {DIMENSIONS.map((d) => (
                          <td
                            key={d.key}
                            className={cn("border-r px-2 py-1 text-center", rowBg)}
                          >
                            <Input
                              type="number"
                              inputMode="decimal"
                              min={0}
                              max={d.max}
                              step={0.5}
                              value={draft[d.key]}
                              onChange={(e) =>
                                updateCell(enrollmentId, d.key, e.target.value)
                              }
                              className="h-9 w-20 text-center"
                            />
                          </td>
                        ))}
                        <td className="border-r bg-univalle/10 px-3 py-2 text-center font-semibold text-univalle">
                          {total.toFixed(2)}
                        </td>
                        <td className={cn("border-r px-3 py-2 text-center", rowBg)}>
                          <Badge className={cn("gap-1.5", meta.badgeCls)}>
                            <span
                              className={cn(
                                "size-2 rounded-full",
                                meta.dotCls,
                              )}
                            />
                            {meta.label}
                          </Badge>
                        </td>
                        <td className={cn("px-3 py-2 text-center", rowBg)}>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSave(s)}
                            disabled={register.isPending}
                          >
                            <SaveIcon data-icon="inline-start" />
                            Guardar
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="font-medium">Ponderacion RM 0001/2026:</span>
        <span>SER {DIMENSION_WEIGHTS.SER}</span>
        <span>SABER {DIMENSION_WEIGHTS.SABER}</span>
        <span>HACER {DIMENSION_WEIGHTS.HACER}</span>
        <span>AUTO {DIMENSION_WEIGHTS.AUTO}</span>
        <span className="ml-4 font-medium">Semaforo ML (Tabla 32):</span>
        {(
          Object.keys(RISK_META) as Array<keyof typeof RISK_META>
        ).map((k) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className={cn("size-2 rounded-full", RISK_META[k].dotCls)} />
            {RISK_META[k].label}
          </span>
        ))}
      </div>
    </div>
  )
}
