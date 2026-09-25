import { useMemo, useState } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart } from "@/components/charts/bar-chart"
import { Bar } from "@/components/charts/bar"
import { BarXAxis } from "@/components/charts/bar-x-axis"
import { Grid } from "@/components/charts/grid"
import { ChartTooltip } from "@/components/charts/tooltip/chart-tooltip"
import { statusOf } from "@/lib/grading"

import { useCentralizer } from "../hooks/useGradebook"

const SHORT = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 4)
    .toUpperCase()

export interface DashboardChartsProps {
  courseId: string
}

/** El curso entero: un tablero muestra a todos los estudiantes o no muestra nada útil. */
const WHOLE_COURSE = { offset: 1, limit: 200, sort: "asc" as const }

/** Como el tablero nombra cada trimestre en los títulos de las tarjetas. */
const ORDINAL: Record<number, string> = { 1: "1er", 2: "2do", 3: "3er" }

export function DashboardCharts({ courseId }: DashboardChartsProps) {
  // El trimestre era un 1 escrito en la llamada, no sólo en el título: el tablero no podía mostrar
  // otro. En junio el docente miraba las notas de marzo creyendo que eran las de ahora.
  const [trimester, setTrimester] = useState(1)
  const { data } = useCentralizer(courseId, trimester, WHOLE_COURSE)
  const rows = useMemo(() => data?.content ?? [], [data])

  const avgBySubject = useMemo(() => {
    const subjects = rows[0]?.subjects ?? []
    return subjects.map((s) => {
      const vals = rows
        .map((r) => r.subjects.find((x) => x.classGroupId === s.classGroupId))
        // Estrechado, no afirmado: el filter solo deja el undefined dentro del tipo, y el `!`
        // que venía después era decirle al compilador que mire para otro lado.
        .filter((x): x is NonNullable<typeof x> => Boolean(x?.graded))
        .map((x) => Number(x.total))
      const avg = vals.length
        ? Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1))
        : 0
      return { name: SHORT(s.subjectName), average: avg }
    })
  }, [rows])

  const passFailCounts = useMemo(() => {
    let passed = 0
    let failed = 0
    for (const r of rows) {
      if (statusOf(Number(r.generalAverage)) === "APROBADO") passed++
      else failed++
    }
    return [
      { name: "Aprobados", total: passed },
      { name: "Reprobados", total: failed },
    ]
  }, [rows])

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
              Promedio por materia ({ORDINAL[trimester]} trimestre)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {avgBySubject.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Sin notas registradas.
              </p>
            ) : (
              /*
                Sin BarYAxis. Ese componente rotula el eje de categorías de un gráfico de barras
                HORIZONTAL: en uno vertical escribe el nombre de la categoría a la izquierda,
                recortado a 70px, y era el "probados" y el "APYV" sueltos que aparecían fuera del
                área. Los valores se leen en el tooltip y la grilla da la referencia; un eje
                numérico de verdad todavía no existe entre estos componentes.
              */
              <BarChart data={avgBySubject} xDataKey="name" aspectRatio="2 / 1">
                <Grid horizontal />
                <Bar dataKey="average" fill="var(--brand)" />
                <BarXAxis />
                <ChartTooltip />
              </BarChart>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Aprobados vs reprobados ({ORDINAL[trimester]} trimestre)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart data={passFailCounts} xDataKey="name" aspectRatio="2 / 1">
              <Grid horizontal />
              <Bar dataKey="total" fill="var(--chart-2)" />
              <BarXAxis />
              <ChartTooltip />
            </BarChart>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
