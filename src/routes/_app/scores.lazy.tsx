import { useMemo } from "react"
import { createLazyFileRoute } from "@tanstack/react-router"
import { Loader2Icon } from "lucide-react"

import { NotebookManager } from "@/features/notebook/components/NotebookManager"
import type {
  StudentScoreRow,
  SubjectArea,
} from "@/features/notebook/types"
import { useAuthStore } from "@/features/auth/store/authStore"
import { useTeacherStudents } from "@/features/students/hooks/useTeacherStudents"

export const Route = createLazyFileRoute("/_app/scores")({
  component: ScoresPage,
})

function ScoresPage() {
  const userId = useAuthStore((s) => s.userId)
  const studentsQuery = useTeacherStudents(userId)

  // Derive subjects from teacher's student enrollments
  const subjects = useMemo<SubjectArea[]>(() => {
    const map = new Map<string, string>()
    for (const s of studentsQuery.data ?? []) {
      for (const e of s.enrollments) {
        if (!map.has(e.subjectId)) map.set(e.subjectId, e.subjectName)
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({
      id,
      name,
      shortName: name.slice(0, 3).toUpperCase(),
    }))
  }, [studentsQuery.data])

  const rows = useMemo<StudentScoreRow[]>(() => {
    return (studentsQuery.data ?? []).map((s) => ({
      studentId: s.id,
      fullName: `${s.lastNames} ${s.names}`.trim(),
      rudeCode: s.rudeCode,
      enrollmentsBySubject: Object.fromEntries(
        s.enrollments.map((e) => [e.subjectId, e.enrollmentId]),
      ),
    }))
  }, [studentsQuery.data])

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Cuaderno de calificaciones</h1>
        <p className="text-sm text-muted-foreground">
          Ponderacion RM 0001/2026 — alerta semaforo ML.
        </p>
      </div>

      {studentsQuery.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" />
          Cargando datos...
        </div>
      ) : studentsQuery.isError ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Error al cargar estudiantes.
        </div>
      ) : (
        <NotebookManager subjects={subjects} students={rows} />
      )}
    </div>
  )
}
