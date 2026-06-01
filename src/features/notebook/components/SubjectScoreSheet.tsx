import { useEffect, useMemo, useState } from "react"
import { Loader2Icon, SaveIcon, SparklesIcon } from "lucide-react"

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
import { DataTablePagination } from "@/components/shared/DataTablePagination"
import { useCourseScores } from "@/features/gradebook/hooks/useGradebook"
import type { CourseScoreRow } from "@/features/gradebook/types"

import {
  DIMENSION_WEIGHTS,
  RISK_META,
  classifyRisk,
  totalFromDraft,
  type ScoreDraft,
  type Trimester,
} from "../types"
import { useRegisterScore } from "../hooks/useRegisterScore"

export interface SubjectScoreSheetProps {
  subjectName: string
  classGroupId: string
}

const DEFAULT_DRAFT: ScoreDraft = { ser: 0, saber: 0, hacer: 0, auto: 0 }

const DIMENSIONS: Array<{ key: keyof ScoreDraft; label: string; max: number }> =
  [
    { key: "ser", label: "SER", max: DIMENSION_WEIGHTS.SER },
    { key: "saber", label: "SABER", max: DIMENSION_WEIGHTS.SABER },
    { key: "hacer", label: "HACER", max: DIMENSION_WEIGHTS.HACER },
    { key: "auto", label: "DECIDIR / AUTO", max: DIMENSION_WEIGHTS.AUTO },
  ]

const clampNumeric = (raw: string, max: number): number => {
  if (raw === "") return 0
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 0) return 0
  return n > max ? max : Number(n.toFixed(2))
}

const draftFromRow = (row: CourseScoreRow, trimester: number): ScoreDraft => {
  const found = row.scores.find((s) => s.trimester === trimester)
  if (!found) return { ...DEFAULT_DRAFT }
  return {
    ser: Number(found.scoreBeing),
    saber: Number(found.scoreKnowing),
    hacer: Number(found.scoreDoing),
    auto: Number(found.scoreDeciding),
  }
}

export function SubjectScoreSheet({
  subjectName,
  classGroupId,
}: SubjectScoreSheetProps) {
  const [trimester, setTrimester] = useState<Trimester>(1)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [drafts, setDrafts] = useState<Record<string, ScoreDraft>>({})

  const query = useMemo(
    () => ({ classGroupId, trimester, offset: page, limit, sort: "asc" as const }),
    [classGroupId, trimester, page, limit],
  )
  const { data, isLoading, isFetching } = useCourseScores(query)
  const register = useRegisterScore()

  const rows = useMemo(() => data?.content ?? [], [data])

  // Hydrate drafts from server rows whenever data/trimester changes.
  useEffect(() => {
    const next: Record<string, ScoreDraft> = {}
    for (const r of rows) next[r.enrollmentId] = draftFromRow(r, trimester)
    setDrafts(next)
  }, [rows, trimester])

  const updateCell = (
    enrollmentId: string,
    key: keyof ScoreDraft,
    raw: string,
  ) => {
    const dim = DIMENSIONS.find((d) => d.key === key)!
    const value = clampNumeric(raw, dim.max)
    setDrafts((prev) => ({
      ...prev,
      [enrollmentId]: { ...(prev[enrollmentId] ?? DEFAULT_DRAFT), [key]: value },
    }))
  }

  const handleSave = (enrollmentId: string) => {
    const d = drafts[enrollmentId] ?? DEFAULT_DRAFT
    register.mutate({
      id_enrollment: enrollmentId,
      trimester,
      scoreBeing: d.ser,
      scoreKnowing: d.saber,
      scoreDoing: d.hacer,
      scoreDeciding: d.auto,
    })
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{subjectName}</h2>
        <div className="flex items-center gap-2">
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
                <th className="sticky left-0 z-20 min-w-[16rem] border-r border-b bg-muted px-3 py-2 text-left font-medium shadow-[2px_0_0_0_var(--border)]">
                  Estudiante
                </th>
                {DIMENSIONS.map((d) => (
                  <th
                    key={d.key}
                    className="min-w-28 border-r border-b bg-muted/50 px-3 py-2 text-center font-medium"
                  >
                    <div className="flex flex-col leading-tight">
                      <span>{d.label}</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        /{d.max}
                      </span>
                    </div>
                  </th>
                ))}
                <th className="min-w-24 border-r border-b bg-univalle/10 px-3 py-2 text-center font-semibold text-univalle">
                  TOTAL
                </th>
                <th className="min-w-44 border-r border-b bg-muted/50 px-3 py-2 text-center font-medium">
                  <div className="flex items-center justify-center gap-1.5">
                    <SparklesIcon className="size-3.5" />
                    Alerta ML
                  </div>
                </th>
                <th className="min-w-24 border-b bg-muted/50 px-3 py-2 text-center font-medium">
                  Accion
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={DIMENSIONS.length + 4} className="px-3 py-6 text-center text-muted-foreground">
                    <Loader2Icon className="mx-auto size-4 animate-spin" />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={DIMENSIONS.length + 4} className="px-3 py-6 text-center text-muted-foreground">
                    Sin estudiantes en esta materia.
                  </td>
                </tr>
              ) : (
                rows.map((r, idx) => {
                  const draft = drafts[r.enrollmentId] ?? DEFAULT_DRAFT
                  const total = totalFromDraft(draft)
                  const meta = RISK_META[classifyRisk(total)]
                  const rowBg = idx % 2 === 0 ? "bg-card" : "bg-muted"
                  return (
                    <tr key={r.enrollmentId} className="border-t">
                      <td className={cn("sticky left-0 z-10 min-w-[16rem] border-r px-3 py-2 shadow-[2px_0_0_0_var(--border)]", rowBg)}>
                        <span className="font-medium">{r.fullName}</span>
                      </td>
                      {DIMENSIONS.map((d) => (
                        <td key={d.key} className={cn("border-r px-2 py-1 text-center", rowBg)}>
                          <Input
                            type="number"
                            inputMode="decimal"
                            min={0}
                            max={d.max}
                            step={0.5}
                            value={draft[d.key]}
                            onChange={(e) => updateCell(r.enrollmentId, d.key, e.target.value)}
                            className="h-9 w-20 text-center"
                          />
                        </td>
                      ))}
                      <td className="border-r bg-univalle/10 px-3 py-2 text-center font-semibold text-univalle">
                        {total.toFixed(2)}
                      </td>
                      <td className={cn("border-r px-3 py-2 text-center", rowBg)}>
                        <Badge className={cn("gap-1.5", meta.badgeCls)}>
                          <span className={cn("size-2 rounded-full", meta.dotCls)} />
                          {meta.label}
                        </Badge>
                      </td>
                      <td className={cn("px-3 py-2 text-center", rowBg)}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSave(r.enrollmentId)}
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

      <DataTablePagination
        page={data?.page != null ? data.page + 1 : page}
        pageSize={limit}
        total={data?.total ?? 0}
        totalPages={data?.totalPages ?? 1}
        isFetching={isFetching}
        onPageChange={setPage}
        onPageSizeChange={(s) => {
          setLimit(s)
          setPage(1)
        }}
      />

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="font-medium">Ponderacion RM 0001/2026:</span>
        <span>SER {DIMENSION_WEIGHTS.SER}</span>
        <span>SABER {DIMENSION_WEIGHTS.SABER}</span>
        <span>HACER {DIMENSION_WEIGHTS.HACER}</span>
        <span>AUTO {DIMENSION_WEIGHTS.AUTO}</span>
      </div>
    </div>
  )
}
