import { useMemo, useState } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart } from "@/components/charts/bar-chart"
import { Bar } from "@/components/charts/bar"
import { BarXAxis } from "@/components/charts/bar-x-axis"
import { Grid } from "@/components/charts/grid"
import { TrendChart } from "@/components/charts/trend-chart"
import { ChartTooltip } from "@/components/charts/tooltip/chart-tooltip"
import { Notice, QueryState } from "@/components/shared/QueryState"
import type { ClassGroupItem } from "@/features/courses/types/course"
import { useClassGroupsRisk } from "@/features/risk/hooks/useRisk"
import { statusOf } from "@/lib/grading"

import {
  useAnnualCentralizers,
  useCentralizers,
  useClassGroupsAttendanceByStudent,
} from "../hooks/useGradebook"
import { courseLabel } from "../utils/courseSummaryStats"
import { BANDS, meanOf, ORDINAL } from "../utils/dashboardShared"

export interface TechnicalDashboardChartsProps {
  /** Las materias que dicta: una por curso, y cada una es una barra de cada gráfico. */
  classGroups: ClassGroupItem[]
  isLoading: boolean
}

/** El curso entero: un tablero muestra a todos los estudiantes o no muestra nada útil. */
const WHOLE_COURSE = { offset: 1, limit: 200, sort: "asc" as const }

/** Cada nivel del modelo con la etiqueta de su serie, la misma del tablero de Dirección. */
const RISK_SERIES = [
  { level: "RiesgoCritico", key: "Crítico" },
  { level: "EnRiesgo", key: "En riesgo" },
  { level: "SinRiesgo", key: "Sin riesgo" },
  { level: "Sobresaliente", key: "Sobresaliente" },
]

/**
 * El tablero del docente técnico: su materia en cada uno de sus cursos.
 *
 * No tiene curso de aula, así que el promedio general y la asistencia diaria no son suyos. Lo que
 * sí es suyo es la nota de su materia (el centralizador ya llega recortado a ella) y las marcas de
 * sesión de sus clases, y con eso compara un curso contra otro.
 */
export function TechnicalDashboardCharts({
  classGroups,
  isLoading,
}: TechnicalDashboardChartsProps) {
  if (isLoading) return <Notice>Cargando…</Notice>
  if (classGroups.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-12 text-center text-muted-foreground">
        Aún no tienes materias asignadas. Cuando Dirección te asigne una, aquí
        verás sus indicadores por curso.
      </div>
    )
  }
  return <TechnicalCharts classGroups={classGroups} />
}

function TechnicalCharts({ classGroups }: { classGroups: ClassGroupItem[] }) {
  const [trimester, setTrimester] = useState(1)

  // Un curso puede aparecer dos veces si dicta dos materias en él; el centralizador es del curso,
  // así que se pide una vez y cada materia toma su columna.
  const courseIds = useMemo(
    () => [...new Set(classGroups.map((g) => g.courseId))],
    [classGroups]
  )
  const groupIds = useMemo(() => classGroups.map((g) => g.id), [classGroups])

  const centralizers = useCentralizers(courseIds, trimester, WHOLE_COURSE)
  const annual = useAnnualCentralizers(courseIds, WHOLE_COURSE)
  const attendance = useClassGroupsAttendanceByStudent(
    groupIds,
    trimester,
    WHOLE_COURSE
  )
  const risk = useClassGroupsRisk(groupIds, trimester)

  const subjects = useMemo(
    () => [...new Set(classGroups.map((g) => g.subjectName))],
    [classGroups]
  )
  // Con una sola materia el curso basta para nombrar la barra; con dos, "Quinto A" saldría dos
  // veces y no se sabría cuál es cuál.
  const labels = useMemo(
    () =>
      classGroups.map((g) =>
        subjects.length > 1
          ? `${courseLabel(g)} · ${g.subjectName}`
          : courseLabel(g)
      ),
    [classGroups, subjects]
  )

  /** Las notas calificadas de su materia, por class group, en el trimestre elegido. */
  const totalsByGroup = useMemo(
    () =>
      classGroups.map((g) => {
        const page = centralizers.data[courseIds.indexOf(g.courseId)]
        return (page?.content ?? [])
          .map((r) => r.subjects.find((s) => s.classGroupId === g.id))
          .filter((s): s is NonNullable<typeof s> => Boolean(s?.graded))
          .map((s) => Number(s.total))
      }),
    [classGroups, courseIds, centralizers.data]
  )

  const averages = useMemo(
    () =>
      labels.flatMap((name, i) => {
        const avg = meanOf(totalsByGroup[i] ?? [])
        return avg === null ? [] : [{ name, promedio: avg }]
      }),
    [labels, totalsByGroup]
  )

  const passFail = useMemo(
    () =>
      labels.flatMap((name, i) => {
        const totals = totalsByGroup[i] ?? []
        if (totals.length === 0) return []
        const passed = totals.filter((t) => statusOf(t) === "APROBADO").length
        return [
          {
            name,
            Aprobados: passed,
            Reprobados: totals.length - passed,
          },
        ]
      }),
    [labels, totalsByGroup]
  )

  const allTotals = useMemo(() => totalsByGroup.flat(), [totalsByGroup])
  const bands = useMemo(
    () =>
      BANDS.map((b) => ({
        name: b.name,
        total: allTotals.filter((n) => n >= b.from && n <= b.to).length,
      })),
    [allTotals]
  )

  // Una línea por curso: la pregunta es cuál mejora y cuál no, y una sola media lo escondería.
  const evolution = useMemo(
    () =>
      classGroups.map((g, i) => {
        const rows = annual.data[courseIds.indexOf(g.courseId)]?.content ?? []
        const mine = rows.flatMap((r) =>
          r.subjects.filter((s) => s.classGroupId === g.id)
        )
        const point = (pick: (s: (typeof mine)[number]) => number | null) =>
          meanOf(mine.map(pick).filter((n): n is number => n !== null && n > 0))
        return {
          label: labels[i],
          color: `var(--chart-${(i % 5) + 1})`,
          points: [
            { x: "1er", y: point((s) => s.trimester1) },
            { x: "2do", y: point((s) => s.trimester2) },
            { x: "3er", y: point((s) => s.trimester3) },
          ],
        }
      }),
    [classGroups, labels, courseIds, annual.data]
  )

  const attendanceByGroup = useMemo(
    () =>
      labels.flatMap((name, i) => {
        const rows = attendance.data[i]?.students.content ?? []
        if (rows.length === 0) return []
        const sum = (pick: (r: (typeof rows)[number]) => number) =>
          rows.reduce((acc, r) => acc + pick(r), 0)
        return [
          {
            name,
            Presentes: sum((r) => r.present),
            // El atraso es asistencia: llegó. Va aparte para que se vea cuántos hubo.
            Atrasos: sum((r) => r.late),
            Ausentes: sum((r) => r.absent),
            Licencias: sum((r) => r.excused),
          },
        ]
      }),
    [labels, attendance.data]
  )
  const hasAttendance = attendanceByGroup.some(
    (r) => r.Presentes + r.Atrasos + r.Ausentes + r.Licencias > 0
  )

  const riskByGroup = useMemo(
    () =>
      labels.map((name, i) => {
        const counts: Record<string, string | number> = { name }
        for (const s of RISK_SERIES) counts[s.key] = 0
        for (const p of risk.data[i] ?? []) {
          const series = RISK_SERIES.find((s) => s.level === p.riskLevel)
          if (series) counts[series.key] = Number(counts[series.key]) + 1
        }
        return counts
      }),
    [labels, risk.data]
  )
  const hasRisk = risk.data.some((d) => (d?.length ?? 0) > 0)

  const ord = ORDINAL[trimester]

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Tu materia en tus cursos: {subjects.join(", ")}.
      </p>

      <Tabs
        value={String(trimester)}
        onValueChange={(v) => setTrimester(Number(v))}
      >
        <TabsList>
          {[1, 2, 3].map((t) => (
            <TabsTrigger key={t} value={String(t)}>
              {ORDINAL[t]} trimestre
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Promedio de tu materia por curso ({ord} trimestre)
            </CardTitle>
            <CardDescription>
              La nota media de tu materia en cada curso; un curso sin notas no
              aparece.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QueryState
              isPending={centralizers.isPending}
              isError={centralizers.isError}
              isEmpty={averages.length === 0}
              empty="Sin notas registradas."
            >
              <BarChart data={averages} xDataKey="name" aspectRatio="2 / 1">
                <Grid horizontal />
                <Bar dataKey="promedio" fill="var(--chart-1)" />
                <BarXAxis />
                <ChartTooltip />
              </BarChart>
            </QueryState>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Aprobados y reprobados por curso
            </CardTitle>
            <CardDescription>
              Cuántos de tus estudiantes aprueban tu materia en cada curso;
              desde 51 se aprueba.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QueryState
              isPending={centralizers.isPending}
              isError={centralizers.isError}
              isEmpty={passFail.length === 0}
              empty="Sin notas registradas."
            >
              <BarChart
                data={passFail}
                xDataKey="name"
                aspectRatio="2 / 1"
                stacked
              >
                <Grid horizontal />
                <Bar dataKey="Aprobados" fill="var(--chart-1)" />
                <Bar dataKey="Reprobados" fill="var(--chart-3)" />
                <BarXAxis />
                <ChartTooltip />
              </BarChart>
            </QueryState>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribución de notas</CardTitle>
            <CardDescription>
              Todos tus estudiantes por tramo de nota en el trimestre elegido:
              0–50 reprueba.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QueryState
              isPending={centralizers.isPending}
              isError={centralizers.isError}
              isEmpty={allTotals.length === 0}
              empty="Sin notas registradas."
            >
              <BarChart data={bands} xDataKey="name" aspectRatio="2 / 1">
                <Grid horizontal />
                <Bar dataKey="total" fill="var(--chart-4)" />
                <BarXAxis />
                <ChartTooltip />
              </BarChart>
            </QueryState>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Evolución del promedio por curso
            </CardTitle>
            <CardDescription>
              Tu materia en los tres trimestres, una línea por curso, para ver
              si cada curso mejora o empeora.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Sin vacío: una línea con huecos sigue siendo una línea. */}
            <QueryState isPending={annual.isPending} isError={annual.isError}>
              <TrendChart maxY={100} series={evolution} unit=" pts" />
            </QueryState>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Asistencia por curso ({ord} trimestre)
            </CardTitle>
            <CardDescription>
              Marcas de tus clases en cada curso; el atraso cuenta como
              asistencia.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QueryState
              isPending={attendance.isPending}
              isError={attendance.isError}
              isEmpty={!hasAttendance}
              empty="Sin asistencia registrada."
            >
              <BarChart
                data={attendanceByGroup}
                xDataKey="name"
                aspectRatio="2 / 1"
                stacked
              >
                <Grid horizontal />
                <Bar dataKey="Presentes" fill="var(--chart-1)" />
                <Bar dataKey="Ausentes" fill="var(--chart-3)" />
                <Bar dataKey="Atrasos" fill="var(--chart-2)" />
                <Bar dataKey="Licencias" fill="var(--chart-4)" />
                <BarXAxis />
                <ChartTooltip />
              </BarChart>
            </QueryState>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Riesgo académico por curso ({ord} trimestre)
            </CardTitle>
            <CardDescription>
              Predicciones del modelo para tu materia, una predicción por
              estudiante, por nivel de riesgo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QueryState
              isPending={risk.isPending}
              isError={risk.isError}
              isEmpty={!hasRisk}
              empty="Sin predicciones en este trimestre."
            >
              <BarChart
                data={riskByGroup}
                xDataKey="name"
                aspectRatio="2 / 1"
                stacked
              >
                <Grid horizontal />
                <Bar dataKey="Crítico" fill="var(--chart-3)" />
                <Bar dataKey="En riesgo" fill="var(--chart-2)" />
                <Bar dataKey="Sin riesgo" fill="var(--chart-1)" />
                <Bar dataKey="Sobresaliente" fill="var(--chart-4)" />
                <BarXAxis />
                <ChartTooltip />
              </BarChart>
            </QueryState>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
