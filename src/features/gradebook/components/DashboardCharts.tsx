import { useMemo } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart } from "@/components/charts/bar-chart"
import { Bar } from "@/components/charts/bar"
import { BarXAxis } from "@/components/charts/bar-x-axis"
import { BarYAxis } from "@/components/charts/bar-y-axis"
import { Grid } from "@/components/charts/grid"
import { ChartTooltip } from "@/components/charts/tooltip/chart-tooltip"
import { situacionOf } from "@/lib/grading"

import { useCentralizer } from "../hooks/useCentralizer"
import type { TeacherSubject } from "@/features/students/services/teacherStudentsService"

const SHORT = (name: string) =>
  name.split(/\s+/).map((w) => w[0]).join("").slice(0, 4).toUpperCase()

export function DashboardCharts({ subjects }: { subjects: TeacherSubject[] }) {
  const { subjects: cols, rows } = useCentralizer(subjects, 1)

  const avgBySubject = useMemo(() => {
    return cols.map((c) => {
      const vals = rows
        .map((r) => r.bySubject[c.subjectId])
        .filter((n): n is number => typeof n === "number")
      const avg = vals.length
        ? Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1))
        : 0
      return { name: SHORT(c.subjectName), promedio: avg }
    })
  }, [cols, rows])

  const aprobReprob = useMemo(() => {
    let apr = 0
    let rep = 0
    for (const r of rows) {
      if (situacionOf(r.promedioGeneral) === "APROBADO") apr++
      else rep++
    }
    return [
      { name: "Aprobados", total: apr },
      { name: "Reprobados", total: rep },
    ]
  }, [rows])

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Promedio por materia (1er trimestre)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {avgBySubject.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Sin notas registradas.
            </p>
          ) : (
            <BarChart data={avgBySubject} xDataKey="name" aspectRatio="2 / 1">
              <Grid horizontal />
              <Bar dataKey="promedio" fill="var(--univalle)" />
              <BarXAxis />
              <BarYAxis />
              <ChartTooltip />
            </BarChart>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Aprobados vs reprobados (1er trimestre)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart data={aprobReprob} xDataKey="name" aspectRatio="2 / 1">
            <Grid horizontal />
            <Bar dataKey="total" fill="var(--chart-2)" />
            <BarXAxis />
            <BarYAxis />
            <ChartTooltip />
          </BarChart>
        </CardContent>
      </Card>
    </div>
  )
}
