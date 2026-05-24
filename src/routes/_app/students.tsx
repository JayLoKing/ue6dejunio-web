import { createFileRoute, redirect } from "@tanstack/react-router"

import { useAuthStore } from "@/features/auth/store/authStore"
import { isRole } from "@/features/auth/types"
import { EnrollStudentDialog } from "@/features/students/components/EnrollStudentDialog"
import {
  StudentsTable,
  type StudentRow,
} from "@/features/students/components/StudentsTable"

export const Route = createFileRoute("/_app/students")({
  beforeLoad: () => {
    const role = useAuthStore.getState().role
    if (!isRole(role, "TEACHER")) {
      throw redirect({ to: "/dashboard" })
    }
  },
  component: StudentsPage,
})

const MOCK_STUDENTS: StudentRow[] = [
  {
    id: "1",
    rudeCode: "808900362026523",
    identityCard: "16541781",
    lastNames: "Alvarez Nicolas",
    names: "Eydan",
    birthDate: "2020-11-09",
    gender: "M",
    gradeName: "Segundo",
    parallelName: "A",
  },
  {
    id: "2",
    rudeCode: "808900362026172",
    identityCard: "16584166",
    lastNames: "Balderrama Castro",
    names: "Dayton Ander",
    birthDate: "2020-12-04",
    gender: "M",
    gradeName: "Segundo",
    parallelName: "A",
  },
  {
    id: "3",
    rudeCode: "808900362026231A",
    identityCard: "16547706",
    lastNames: "Condori Jesus",
    names: "Valentina",
    birthDate: "2020-11-12",
    gender: "F",
    gradeName: "Segundo",
    parallelName: "A",
  },
  {
    id: "4",
    rudeCode: "808900362026121",
    identityCard: "16617701",
    lastNames: "Fernandez Toledo",
    names: "Emily Rashel",
    birthDate: "2021-01-04",
    gender: "F",
    gradeName: "Segundo",
    parallelName: "A",
  },
]

function StudentsPage() {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Estudiantes</h1>
          <p className="text-sm text-muted-foreground">
            Padron inscritos por curso — gestion 2026.
          </p>
        </div>
        <EnrollStudentDialog />
      </div>
      <StudentsTable data={MOCK_STUDENTS} />
    </div>
  )
}
