import { useMemo, useState } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart } from "@/components/charts/bar-chart"
import { Bar } from "@/components/charts/bar"
import { BarXAxis } from "@/components/charts/bar-x-axis"
import { DonutChart } from "@/components/charts/donut-chart"
import { Grid } from "@/components/charts/grid"
import { TrendChart } from "@/components/charts/trend-chart"
import { ChartTooltip } from "@/components/charts/tooltip/chart-tooltip"
import { QueryState } from "@/components/shared/QueryState"
import { useRiskCourseSummary } from "@/features/risk/hooks/useRisk"

import { useCourseSummary } from "../hooks/useGradebook"
import {
  averagesByCourse,
  courseLabel,
  enrolmentByGrade,
  weightedAverage,
} from "../utils/courseSummaryStats"

export interface DirectorDashboardChartsProps {
  /** La gestión, por su id de fila. No el año calendario. */
  academicYearId: number
}

/** Como el tablero nombra cada trimestre en los títulos de las tarjetas. */
const ORDINAL: Record<number, string> = { 1: "1er", 2: "2do", 3: "3er" }

/**
 * El tablero de Dirección: la escuela entera, un curso por fila.
 *
 * Se apoya en los dos endpoints de resumen y no en el centralizador curso por curso. La diferencia
 * no es de estilo: con treinta cursos eran treinta peticiones para dibujar una tabla, y los
 * números salían de un cálculo propio del navegador en vez del que imprime la libreta.
 */
export function DirectorDashboardCharts({
  academicYearId,
}: DirectorDashboardChartsProps) {
  const [trimester, setTrimester] = useState(1)

  const academic = useCourseSummary(academicYearId, trimester)
  const risk = useRiskCourseSummary(academicYearId, trimester)

  // Los tres trimestres a la vez para la evolución institucional. El elegido arriba sale de la
  // caché de estas tres, así que cambiar de pestaña no agrega una consulta.
  const t1 = useCourseSummary(academicYearId, 1)
  const t2 = useCourseSummary(academicYearId, 2)
  const t3 = useCourseSummary(academicYearId, 3)

  const rows = useMemo(() => academic.data ?? [], [academic.data])
  const riskRows = useMemo(() => risk.data ?? [], [risk.data])

  const averages = useMemo(() => averagesByCourse(rows), [rows])

  const passFail = useMemo(
    () =>
      rows.map((r) => ({
        name: courseLabel(r),
        Aprobados: r.passed,
        Reprobados: r.failed,
      })),
    [rows]
  )

  const riskByCourse = useMemo(
    () =>
      riskRows.map((r) => ({
        name: courseLabel(r),
        Crítico: r.critical,
        "En riesgo": r.atRisk,
        "Sin riesgo": r.safe,
        Sobresaliente: r.outstanding,
        "Sin predecir": r.unpredicted,
      })),
    [riskRows]
  )

  const evolution = useMemo(
    () => [
      {
        label: "Promedio institucional",
        color: "var(--chart-1)",
        points: [
          { x: "1er", y: weightedAverage(t1.data ?? []) },
          { x: "2do", y: weightedAverage(t2.data ?? []) },
          { x: "3er", y: weightedAverage(t3.data ?? []) },
        ],
      },
    ],
    [t1.data, t2.data, t3.data]
  )

  const byGrade = useMemo(() => enrolmentByGrade(rows), [rows])

  // Los grados vienen en el orden del repositorio (`ORDER BY c.grade.id, c.parallel.id`), así que
  // el color de cada porción es estable entre consultas. Ordenarlos acá por nombre sería peor:
  // daría "Cuarto, Primero, Quinto", que no es el orden en que la escuela lee sus grados.
  const gradeSlices = useMemo(
    () =>
      byGrade.map((g, i) => ({
        label: g.name,
        value: g.estudiantes,
        color: `var(--chart-${(i % 5) + 1})`,
      })),
    [byGrade]
  )

  const ord = ORDINAL[trimester]

  return (
    <div className="space-y-4">
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
              Promedio por curso ({ord} trimestre)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <QueryState
              isPending={academic.isPending}
              isError={academic.isError}
              isEmpty={averages.length === 0}
              empty="Ningún curso tiene notas en este trimestre."
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
              Aprobados y reprobados por curso ({ord} trimestre)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <QueryState
              isPending={academic.isPending}
              isError={academic.isError}
              isEmpty={passFail.length === 0}
              empty="Sin cursos en la gestión."
            >
              {/* Apiladas: la columna entera es el curso, y la franja roja se lee como la parte
                  que está reprobando sin tener que comparar dos barras vecinas. */}
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
            <CardTitle className="text-base">
              Riesgo por curso ({ord} trimestre)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <QueryState
              isPending={risk.isPending}
              isError={risk.isError}
              isEmpty={riskByCourse.length === 0}
              empty="Sin cursos en la gestión."
            >
              {/* Cada estudiante cuenta una vez, en su peor materia — así lo arma el endpoint.
                  "Sin predecir" está a propósito: sin esa franja un curso que el barrido no
                  alcanzó se ve idéntico a uno donde nadie está en problemas. */}
              <BarChart
                data={riskByCourse}
                xDataKey="name"
                aspectRatio="2 / 1"
                stacked
              >
                <Grid horizontal />
                <Bar dataKey="Crítico" fill="var(--chart-3)" />
                <Bar dataKey="En riesgo" fill="var(--chart-2)" />
                <Bar dataKey="Sin riesgo" fill="var(--chart-1)" />
                <Bar dataKey="Sobresaliente" fill="var(--chart-4)" />
                <Bar dataKey="Sin predecir" fill="var(--chart-5)" />
                <BarXAxis />
                <ChartTooltip />
              </BarChart>
            </QueryState>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Evolución del promedio institucional
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Ponderado por matrícula, no promedio de promedios: un paralelo de ocho no pesa lo
                mismo que uno de treinta. Un trimestre sin calificar es un hueco en la línea. */}
            <QueryState
              isPending={t1.isPending || t2.isPending || t3.isPending}
              isError={t1.isError || t2.isError || t3.isError}
            >
              <TrendChart maxY={100} series={evolution} unit=" pts" />
            </QueryState>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Matrícula por grado</CardTitle>
          </CardHeader>
          <CardContent>
            <QueryState
              isPending={academic.isPending}
              isError={academic.isError}
              isEmpty={byGrade.length === 0}
              empty="Sin cursos en la gestión."
            >
              <DonutChart centerLabel="estudiantes" data={gradeSlices} />
            </QueryState>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
