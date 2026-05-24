import { useState } from "react"
import { createLazyFileRoute } from "@tanstack/react-router"

import { AttendanceMatrix } from "@/features/attendance/components/AttendanceMatrix"
import type { StudentEnrollmentRow } from "@/features/attendance/types"
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

const MOCK_STUDENTS: StudentEnrollmentRow[] = [
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
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Cuaderno de asistencias</h1>
          <p className="text-sm text-muted-foreground">
            Control diario por curso. Click ciclico P → A → L.
          </p>
        </div>
        <div className="flex items-center gap-2">
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
      <AttendanceMatrix
        students={MOCK_STUDENTS}
        year={year}
        month={month}
      />
    </div>
  )
}
