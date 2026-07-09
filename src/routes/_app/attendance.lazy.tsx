import { useMemo, useState } from "react"
import { createLazyFileRoute } from "@tanstack/react-router"
import { Loader2Icon } from "lucide-react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCurrentContext } from "@/features/auth/hooks/useCurrentContext"
import { useCourseStudents } from "@/features/courses/hooks/useCourses"
import { useCourseAttendance } from "@/features/gradebook/hooks/useGradebook"
import {
  AttendanceMatrix,
  type AttendanceStudentRow,
} from "@/features/attendance/components/AttendanceMatrix"
import {
  useDailyAttendance,
  useSessionAttendance,
} from "@/features/attendance/hooks/useAttendance"
import { API_TO_CELL, type AttendanceCellStatus } from "@/features/attendance/types"

export const Route = createLazyFileRoute("/_app/attendance")({
  component: AttendancePage,
})

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]

function AttendancePage() {
  const ctx = useCurrentContext()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  if (ctx.isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2Icon className="size-4 animate-spin" /> Cargando…
      </div>
    )
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">
            {ctx.homeroomCourseId
              ? "Asistencia diaria del curso"
              : "Asistencia de mi materia"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {ctx.homeroomCourseId
              ? "Regularidad oficial (curso de aula)."
              : "Asistencia por sesion de materia (docente tecnico)."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[year - 1, year, year + 1].map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {ctx.homeroomCourseId ? (
        <DailyCourseAttendance courseId={ctx.homeroomCourseId} year={year} month={month} />
      ) : (
        <SessionAttendance year={year} month={month} />
      )}
    </div>
  )
}

// ---- Aula: asistencia diaria del curso ----
function DailyCourseAttendance({ courseId, year, month }: { courseId: string; year: number; month: number }) {
  const studentsQuery = useCourseStudents(courseId, { offset: 1, limit: 200, sort: "asc" })
  const attQuery = useCourseAttendance(courseId, { offset: 1, limit: 200, sort: "asc" })
  const daily = useDailyAttendance()

  const students = useMemo<AttendanceStudentRow[]>(
    () =>
      (studentsQuery.data?.content ?? []).map((s) => ({
        courseEnrollmentId: s.courseEnrollmentId,
        fullName: s.fullName,
        rudeCode: s.rudeCode,
      })),
    [studentsQuery.data],
  )

  const initialData = useMemo(() => {
    const prefix = `${year}-${String(month).padStart(2, "0")}-`
    const out: Record<string, Record<string, AttendanceCellStatus>> = {}
    for (const row of attQuery.data?.content ?? []) {
      const byDate: Record<string, AttendanceCellStatus> = {}
      for (const a of row.attendances) {
        if (a.date.startsWith(prefix)) byDate[a.date] = API_TO_CELL[a.status as keyof typeof API_TO_CELL]
      }
      out[row.courseEnrollmentId] = byDate
    }
    return out
  }, [attQuery.data, year, month])

  if (studentsQuery.isLoading) {
    return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2Icon className="size-4 animate-spin" /> Cargando estudiantes…</div>
  }

  return (
    <AttendanceMatrix
      students={students}
      year={year}
      month={month}
      initialData={initialData}
      onMark={(ce, date, status) => daily.mutate({ id_course_enrollment: ce, date, status })}
    />
  )
}

// ---- Tecnico: asistencia por sesion de materia ----
function SessionAttendance({ year, month }: { year: number; month: number }) {
  const ctx = useCurrentContext()
  const [classGroupId, setClassGroupId] = useState<string>("")
  const effective = classGroupId || ctx.classGroups[0]?.id || ""
  const cg = ctx.classGroups.find((c) => c.id === effective)

  const studentsQuery = useCourseStudents(cg?.courseId, { offset: 1, limit: 200, sort: "asc" })
  const session = useSessionAttendance()

  const students = useMemo<AttendanceStudentRow[]>(
    () =>
      (studentsQuery.data?.content ?? []).map((s) => ({
        courseEnrollmentId: s.courseEnrollmentId,
        fullName: s.fullName,
        rudeCode: s.rudeCode,
      })),
    [studentsQuery.data],
  )

  return (
    <div className="flex flex-col gap-4">
      <Select value={effective} onValueChange={setClassGroupId} disabled={ctx.classGroups.length === 0}>
        <SelectTrigger className="w-72"><SelectValue placeholder="Materia" /></SelectTrigger>
        <SelectContent>
          {ctx.classGroups.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.subjectName} — {c.gradeName} "{c.parallelName}"
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {!cg ? (
        <p className="text-sm text-muted-foreground">Selecciona una materia.</p>
      ) : (
        <AttendanceMatrix
          students={students}
          year={year}
          month={month}
          onMark={(ce, date, status) =>
            session.mutate({ id_course_enrollment: ce, id_class_group: cg.id, date, status })
          }
        />
      )}
    </div>
  )
}
