import { useMemo } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart } from "@/components/charts/bar-chart"
import { Bar } from "@/components/charts/bar"
import { BarXAxis } from "@/components/charts/bar-x-axis"
import { DonutChart } from "@/components/charts/donut-chart"
import { Grid } from "@/components/charts/grid"
import { TrendChart } from "@/components/charts/trend-chart"
import { ChartTooltip } from "@/components/charts/tooltip/chart-tooltip"
import { useAllCourses } from "@/features/courses/hooks/useCourses"

import { useStudentMovementSummary } from "../hooks/useStudent"
import { movementByMonth, runningEnrolment } from "../utils/movementStats"

export interface SecretaryDashboardChartsProps {
  /** La gestión, por su id de fila. No el año calendario. */
  academicYearId: number
}

/**
 * Cómo se nombra una baja que no tiene motivo guardado.
 *
 * No es una categoría más: es la ausencia del dato. Las bajas anteriores a la V14, que agregó la
 * columna, no lo tienen. Meterlas en "Otro" las contaría como una decisión que alguien tomó.
 */
const NO_REASON = "Sin motivo registrado"

function Notice({ children }: { children: string }) {
  return (
    <p className="py-8 text-center text-sm text-muted-foreground">{children}</p>
  )
}

/**
 * Qué mostrar dentro de una tarjeta, según en qué estado está la consulta.
 *
 * Mientras carga el arreglo está vacío, y sin esta rama la tarjeta decía "sin movimiento
 * registrado" hasta que llegaba la respuesta. Un error decía lo mismo, que es peor: afirma que no
 * pasó nada cuando lo cierto es que no se pudo preguntar.
 */
function CardBody({
  isPending,
  isError,
  isEmpty,
  empty,
  children,
}: {
  isPending: boolean
  isError: boolean
  isEmpty: boolean
  empty: string
  children: React.ReactNode
}) {
  if (isError) return <Notice>No se pudo cargar la información.</Notice>
  if (isPending) return <Notice>Cargando…</Notice>
  if (isEmpty) return <Notice>{empty}</Notice>
  return <>{children}</>
}

/**
 * El tablero de Secretaría: quién entra, quién sale y qué cursos hay para recibirlos.
 *
 * Deliberadamente sin notas ni riesgo. Secretaría administra matrícula; los promedios por curso
 * viven en el tablero de Dirección y el endpoint que los da está cerrado a este rol.
 */
export function SecretaryDashboardCharts({
  academicYearId,
}: SecretaryDashboardChartsProps) {
  const movement = useStudentMovementSummary(academicYearId)
  const courses = useAllCourses()

  const months = useMemo(() => movement.data?.byMonth ?? [], [movement.data])

  const byMonth = useMemo(() => movementByMonth(months), [months])
  const enrolment = useMemo(() => runningEnrolment(months), [months])

  const byReason = useMemo(
    () =>
      (movement.data?.byReason ?? []).map((r, i) => ({
        label: r.reason ?? NO_REASON,
        value: r.students,
        color: `var(--chart-${(i % 5) + 1})`,
      })),
    [movement.data]
  )

  // Cuántos paralelos tiene cada grado: es la capacidad instalada, que es contra lo que Secretaría
  // decide dónde entra un estudiante nuevo.
  const byGrade = useMemo(() => {
    const totals = new Map<string, number>()
    for (const c of courses.data?.content ?? []) {
      totals.set(c.gradeName, (totals.get(c.gradeName) ?? 0) + 1)
    }
    return [...totals.entries()].map(([name, paralelos]) => ({
      name,
      paralelos,
    }))
  }, [courses.data])

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Altas y bajas por mes</CardTitle>
        </CardHeader>
        <CardContent>
          <CardBody
            isPending={movement.isPending}
            isError={movement.isError}
            isEmpty={byMonth.length === 0}
            empty="Sin movimiento registrado en la gestión."
          >
            {/* Agrupadas y no apiladas: no son partes de un todo, son dos cosas opuestas, y
                apilarlas haría que un mes de muchas bajas se vea como un mes de mucha actividad. */}
            <BarChart data={byMonth} xDataKey="name" aspectRatio="2 / 1">
              <Grid horizontal />
              <Bar dataKey="Altas" fill="var(--chart-1)" />
              <Bar dataKey="Bajas" fill="var(--chart-3)" />
              <BarXAxis />
              <ChartTooltip />
            </BarChart>
          </CardBody>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Matrícula acumulada</CardTitle>
        </CardHeader>
        <CardContent>
          <CardBody
            isPending={movement.isPending}
            isError={movement.isError}
            isEmpty={enrolment.length === 0}
            empty="Sin movimiento registrado en la gestión."
          >
            {/* Los meses sin movimiento no están, y está bien: la API manda sólo los que tuvieron
                alguno, y una gestión que empieza en febrero no debe mostrar un enero en cero. */}
            <TrendChart
              series={[
                {
                  label: "Estudiantes",
                  color: "var(--chart-1)",
                  points: enrolment,
                },
              ]}
            />
          </CardBody>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bajas por motivo</CardTitle>
        </CardHeader>
        <CardContent>
          <CardBody
            isPending={movement.isPending}
            isError={movement.isError}
            isEmpty={byReason.length === 0}
            empty="Ninguna baja en la gestión."
          >
            <DonutChart centerLabel="bajas" data={byReason} />
          </CardBody>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Paralelos por grado</CardTitle>
        </CardHeader>
        <CardContent>
          <CardBody
            isPending={courses.isPending}
            isError={courses.isError}
            isEmpty={byGrade.length === 0}
            empty="Sin cursos abiertos."
          >
            <BarChart data={byGrade} xDataKey="name" aspectRatio="2 / 1">
              <Grid horizontal />
              <Bar dataKey="paralelos" fill="var(--chart-2)" />
              <BarXAxis />
              <ChartTooltip />
            </BarChart>
          </CardBody>
        </CardContent>
      </Card>
    </div>
  )
}
