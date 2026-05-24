import { createLazyFileRoute } from "@tanstack/react-router"

import { NotebookManager } from "@/features/notebook/components/NotebookManager"
import type {
  StudentScoreRow,
  SubjectArea,
} from "@/features/notebook/types"

export const Route = createLazyFileRoute("/_app/scores")({
  component: ScoresPage,
})

const MOCK_SUBJECTS: SubjectArea[] = [
  { id: "math", name: "Matematicas", shortName: "MAT" },
  { id: "lang", name: "Lenguaje", shortName: "LEN" },
  { id: "cn", name: "Ciencias Naturales", shortName: "CN" },
  { id: "cs", name: "Ciencias Sociales", shortName: "CS" },
  { id: "ef", name: "Educacion Fisica", shortName: "EF" },
  { id: "rel", name: "Religion, Etica y Moral", shortName: "REL" },
  { id: "art", name: "Artes Plasticas", shortName: "ART" },
  { id: "mus", name: "Musica", shortName: "MUS" },
]

const MOCK_STUDENTS: StudentScoreRow[] = [
  {
    enrollmentId: "11111111-1111-1111-1111-111111111111",
    studentId: "s1",
    fullName: "Alejandro Mamani Quispe",
    rudeCode: "1009-2025-0001",
  },
  {
    enrollmentId: "22222222-2222-2222-2222-222222222222",
    studentId: "s2",
    fullName: "Camila Flores Choque",
    rudeCode: "1009-2025-0002",
  },
  {
    enrollmentId: "33333333-3333-3333-3333-333333333333",
    studentId: "s3",
    fullName: "Diego Rojas Vargas",
    rudeCode: "1009-2025-0003",
  },
  {
    enrollmentId: "44444444-4444-4444-4444-444444444444",
    studentId: "s4",
    fullName: "Elena Mendoza Aruquipa",
    rudeCode: "1009-2025-0004",
  },
  {
    enrollmentId: "55555555-5555-5555-5555-555555555555",
    studentId: "s5",
    fullName: "Fabricio Salazar Condori",
    rudeCode: "1009-2025-0005",
  },
]

function ScoresPage() {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Cuaderno de calificaciones</h1>
        <p className="text-sm text-muted-foreground">
          Ponderacion RM 0001/2026 — alerta semaforo ML.
        </p>
      </div>
      <NotebookManager subjects={MOCK_SUBJECTS} students={MOCK_STUDENTS} />
    </div>
  )
}
