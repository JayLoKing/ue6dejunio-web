import { useMemo, useState } from "react"
import { createLazyFileRoute } from "@tanstack/react-router"
import { Loader2Icon } from "lucide-react"

import { AttendanceMatrix } from "@/features/attendance/components/AttendanceMatrix"
import type { StudentEnrollmentRow } from "@/features/attendance/types"
import { useAttendanceMatrix } from "@/features/attendance/hooks/useAttendanceMatrix"
import { useAuthStore } from "@/features/auth/store/authStore"
import { useTeacherStudents } from "@/features/students/hooks/useTeacherStudents"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export const Route = createLazyFileRoute("/_app/attendance")({
  component: AttendancePage,
})

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]

function AttendancePage() {
  const userId = useAuthStore((s) => s.userId)
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  const studentsQuery = useTeacherStudents(userId, {
    offset: 1,
    limit: 200,
    sort: "asc",
  })

  // Derive subjects from enrollments
  const subjects = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of studentsQuery.data?.content ?? []) {
      for (const e of s.enrollments) {
        if (!map.has(e.subjectId)) map.set(e.subjectId, e.subjectName)
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [studentsQuery.data])

  const [activeSubject, setActiveSubject] = useState<string>("")

  // Auto-select first subject when data loads
  const effectiveSubject =
    activeSubject || subjects[0]?.id || ""

  const rows = useMemo<StudentEnrollmentRow[]>(() => {
    return (studentsQuery.data?.content ?? []).map((s) => ({
      studentId: s.id,
      fullName: `${s.lastNames} ${s.names}`.trim(),
      rudeCode: s.rudeCode,
      enrollmentsBySubject: Object.fromEntries(
        s.enrollments.map((e) => [e.subjectId, e.enrollmentId]),
      ),
    }))
  }, [studentsQuery.data])

  // Enrollment ids for the active subject → hydrate saved attendance.
  const enrollmentIds = useMemo(() => {
    if (!effectiveSubject) return []
    return rows
      .map((r) => r.enrollmentsBySubject[effectiveSubject])
      .filter((id): id is string => Boolean(id))
  }, [rows, effectiveSubject])

  const { data: initialData } = useAttendanceMatrix(
    enrollmentIds,
    year,
    month,
  )

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Cuaderno de asistencias</h1>
          <p className="text-sm text-muted-foreground">
            Control diario por materia. Click ciclico P → A → L.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={effectiveSubject}
            onValueChange={setActiveSubject}
            disabled={subjects.length === 0}
          >
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Materia" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String(month)}
            onValueChange={(v) => setMonth(Number(v))}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={m} value={String(i + 1)}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String(year)}
            onValueChange={(v) => setYear(Number(v))}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[year - 1, year, year + 1].map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {studentsQuery.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" />
          Cargando estudiantes...
        </div>
      ) : studentsQuery.isError ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Error al cargar estudiantes.
        </div>
      ) : (
        <AttendanceMatrix
          students={rows}
          subjectId={effectiveSubject}
          year={year}
          month={month}
          initialData={initialData}
        />
      )}
    </div>
  )
}
