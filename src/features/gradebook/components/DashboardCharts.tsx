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
import { statusOf } from "@/lib/grading"
import { useCourseRisk } from "@/features/risk/hooks/useRisk"
import { riskLevelLabel } from "@/features/risk/utils/riskLevel"

import { useCentralizer, useCourseAttendanceStats } from "../hooks/useGradebook"

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

/**
 * Los tramos del histograma de notas.
 *
 * Los cortes no son decorativos: 51 es el umbral de aprobación de la escuela, así que el primer
 * tramo es exactamente "reprobados". Los otros dos parten lo aprobado en el que pasó raspando y el
 * que está cómodo, que es la distinción que un docente necesita para saber a quién sostener.
 */
const BANDS = [
  { name: "0–50", from: 0, to: 50 },
  { name: "51–68", from: 51, to: 68 },
  { name: "69–84", from: 69, to: 84 },
  { name: "85–100", from: 85, to: 100 },
]

const MONTHS_SHORT = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
]

export function DashboardCharts({ courseId }: DashboardChartsProps) {
  // El trimestre era un 1 escrito en la llamada, no sólo en el título: el tablero no podía mostrar
  // otro. En junio el docente miraba las notas de marzo creyendo que eran las de ahora.
  const [trimester, setTrimester] = useState(1)
  const { data } = useCentralizer(courseId, trimester, WHOLE_COURSE)
  const rows = useMemo(() => data?.content ?? [], [data])

  // Los tres trimestres a la vez, para la evolución. Son tres consultas y no una porque el
  // centralizador responde por trimestre; el que está elegido arriba sale de la caché de las tres.
  const t1 = useCentralizer(courseId, 1, WHOLE_COURSE)
  const t2 = useCentralizer(courseId, 2, WHOLE_COURSE)
  const t3 = useCentralizer(courseId, 3, WHOLE_COURSE)

  const attendance = useCourseAttendanceStats(courseId)
  const risk = useCourseRisk(courseId, trimester)

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

  const passFail = useMemo(() => {
    let passed = 0
    let failed = 0
    for (const r of rows) {
      if (statusOf(Number(r.generalAverage)) === "APROBADO") passed++
      else failed++
    }
    return [
      { label: "Aprobados", value: passed, color: "var(--chart-1)" },
      { label: "Reprobados", value: failed, color: "var(--chart-3)" },
    ]
  }, [rows])

  const bands = useMemo(
    () =>
      BANDS.map((b) => ({
        name: b.name,
        total: rows.filter((r) => {
          const n = Number(r.generalAverage)
          return n >= b.from && n <= b.to
        }).length,
      })),
    [rows]
  )

  /** El promedio general del curso en un trimestre, o null si todavía no se calificó. */
  const averageOf = (content: typeof rows | undefined): number | null => {
    const vals = (content ?? [])
      .map((r) => Number(r.generalAverage))
      .filter((n) => Number.isFinite(n) && n > 0)
    if (vals.length === 0) return null
    return Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1))
  }

  const evolution = useMemo(
    () => [
      {
        label: "Promedio del curso",
        color: "var(--chart-1)",
        points: [
          { x: "1er", y: averageOf(t1.data?.content) },
          { x: "2do", y: averageOf(t2.data?.content) },
          { x: "3er", y: averageOf(t3.data?.content) },
        ],
      },
    ],
    [t1.data, t2.data, t3.data]
  )

  // Asistencia mes a mes, apilada. Las tres categorías son excluyentes y suman el total de
  // jornadas, así que apiladas se leen como "de qué está hecho el mes" — que es la pregunta.
  const attendanceByMonth = useMemo(
    () =>
      (attendance.data?.byMonth ?? []).map((m) => ({
        name: MONTHS_SHORT[m.month - 1] ?? String(m.month),
        Presentes: m.present,
        Ausentes: m.absent,
        // Retraso y licencia juntos: ninguno es una falta, y separarlos daría cuatro series
        // apiladas donde las dos de arriba son franjas de dos píxeles que nadie puede comparar.
        Licencias: m.excused + m.late,
      })),
    [attendance.data]
  )

  const riskByLevel = useMemo(() => {
    const tone: Record<string, string> = {
      RiesgoCritico: "var(--chart-3)",
      EnRiesgo: "var(--chart-2)",
      SinRiesgo: "var(--chart-1)",
      Sobresaliente: "var(--chart-4)",
    }
    const counts = new Map<string, number>()
    for (const r of risk.data ?? []) {
      counts.set(r.riskLevel, (counts.get(r.riskLevel) ?? 0) + 1)
    }
    return [...counts.entries()].map(([level, value]) => ({
      label: riskLevelLabel(level),
      value,
      color: tone[level] ?? "var(--chart-5)",
    }))
  }, [risk.data])

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
              Promedio por materia ({ord} trimestre)
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
                área. Los valores se leen en el tooltip y la grilla da la referencia.
              */
              <BarChart data={avgBySubject} xDataKey="name" aspectRatio="2 / 1">
                <Grid horizontal />
                <Bar dataKey="average" fill="var(--chart-1)" />
                <BarXAxis />
                <ChartTooltip />
              </BarChart>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Aprobados y reprobados ({ord} trimestre)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Anillo y no dos barras: la pregunta acá es qué parte del curso, no cuántos. */}
            <DonutChart
              centerLabel="estudiantes"
              data={passFail.filter((s) => s.value > 0)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Distribución de notas ({ord} trimestre)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* El promedio dice dónde está el centro; esto dice si el curso es parejo o está
                partido en dos, que no se ve en ningún otro gráfico del tablero. */}
            <BarChart data={bands} xDataKey="name" aspectRatio="2 / 1">
              <Grid horizontal />
              <Bar dataKey="total" fill="var(--chart-4)" />
              <BarXAxis />
              <ChartTooltip />
            </BarChart>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Evolución del promedio del curso
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Los tres trimestres, sin depender del que esté elegido arriba: la pregunta es si el
                curso mejora, y eso sólo se ve mirándolos juntos. */}
            <TrendChart maxY={100} series={evolution} unit=" pts" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Asistencia por mes</CardTitle>
          </CardHeader>
          <CardContent>
            {attendanceByMonth.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Sin asistencia registrada.
              </p>
            ) : (
              <BarChart
                data={attendanceByMonth}
                xDataKey="name"
                aspectRatio="2 / 1"
                stacked
              >
                <Grid horizontal />
                <Bar dataKey="Presentes" fill="var(--chart-1)" />
                <Bar dataKey="Ausentes" fill="var(--chart-3)" />
                <Bar dataKey="Licencias" fill="var(--chart-2)" />
                <BarXAxis />
                <ChartTooltip />
              </BarChart>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Riesgo académico ({ord} trimestre)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Cuenta predicciones, no estudiantes: un estudiante aparece una vez por materia
                predicha. Es lo que mide el endpoint del curso, y decir "estudiantes" sería
                afirmar otra cosa. */}
            <DonutChart centerLabel="predicciones" data={riskByLevel} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
