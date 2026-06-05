import { useMemo } from "react"
import { useQueries } from "@tanstack/react-query"

import { GradebookService } from "../services/gradebookService"
import type { CourseScoreRow } from "../types"
import type { TeacherSubject } from "@/features/students/services/teacherStudentsService"

export interface CentralizerSubject {
  subjectId: string
  subjectName: string
}

export interface CentralizerRow {
  studentId: string
  fullName: string
  /** subjectId → promedio trimestral de esa materia (o null). */
  bySubject: Record<string, number | null>
  /** promedio general (media de las materias con nota). */
  promedioGeneral: number
}

export interface CentralizerResult {
  subjects: CentralizerSubject[]
  rows: CentralizerRow[]
  isLoading: boolean
  isError: boolean
}

/**
 * Cruza las notas de TODAS las materias del docente (un classGroup por materia)
 * en una matriz estudiante × materia para el trimestre dado.
 */
export function useCentralizer(
  teacherSubjects: TeacherSubject[],
  trimester: number,
): CentralizerResult {
  const results = useQueries({
    queries: teacherSubjects.map((s) => ({
      queryKey: [
        "gradebook",
        "scores",
        { classGroupId: s.classGroupId, trimester, offset: 1, limit: 200, sort: "asc" },
      ] as const,
      queryFn: () =>
        GradebookService.scores({
          classGroupId: s.classGroupId,
          trimester,
          offset: 1,
          limit: 200,
          sort: "asc" as const,
        }),
      enabled: Boolean(s.classGroupId),
      staleTime: 30_000,
    })),
  })

  const isLoading = results.some((r) => r.isLoading)
  const isError = results.some((r) => r.isError)
  const sig = results.map((r) => r.dataUpdatedAt).join("|")

  const data = useMemo<{ subjects: CentralizerSubject[]; rows: CentralizerRow[] }>(() => {
    const subjects = teacherSubjects.map((s) => ({
      subjectId: s.subjectId,
      subjectName: s.subjectName,
    }))

    // studentId → { fullName, bySubject }
    const students = new Map<
      string,
      { fullName: string; bySubject: Record<string, number | null> }
    >()

    results.forEach((r, idx) => {
      const subject = teacherSubjects[idx]
      const content: CourseScoreRow[] = r.data?.content ?? []
      for (const row of content) {
        const entry =
          students.get(row.studentId) ??
          { fullName: row.fullName, bySubject: {} }
        const scoreForTri = row.scores.find((sc) => sc.trimester === trimester)
        entry.bySubject[subject.subjectId] = scoreForTri
          ? Number(scoreForTri.totalScore)
          : null
        students.set(row.studentId, entry)
      }
    })

    const rows: CentralizerRow[] = Array.from(students.entries())
      .map(([studentId, v]) => {
        const vals = subjects
          .map((s) => v.bySubject[s.subjectId])
          .filter((n): n is number => typeof n === "number")
        const promedioGeneral =
          vals.length > 0
            ? Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2))
            : 0
        return { studentId, fullName: v.fullName, bySubject: v.bySubject, promedioGeneral }
      })
      .sort((a, b) => a.fullName.localeCompare(b.fullName))

    return { subjects, rows }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherSubjects, trimester, sig])

  return { ...data, isLoading, isError }
}
