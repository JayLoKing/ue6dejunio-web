import { useState } from "react"
import { Loader2Icon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cualitativoOf, situacionClass, situacionOf } from "@/lib/grading"

import { useCentralizer } from "../hooks/useCentralizer"
import type { TeacherSubject } from "@/features/students/services/teacherStudentsService"

export function PromediosRanking({ subjects }: { subjects: TeacherSubject[] }) {
  const [trimester, setTrimester] = useState(1)
  const { rows, isLoading } = useCentralizer(subjects, trimester)
  const ranked = [...rows].sort((a, b) => b.promedioGeneral - a.promedioGeneral)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Trimestre</span>
        <Select value={String(trimester)} onValueChange={(v) => setTrimester(Number(v))}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1ro</SelectItem>
            <SelectItem value="2">2do</SelectItem>
            <SelectItem value="3">3ro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Estudiante</TableHead>
              <TableHead className="text-center">Promedio</TableHead>
              <TableHead className="text-center">Cualitativo</TableHead>
              <TableHead className="text-center">Situacion</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  <Loader2Icon className="mx-auto size-4 animate-spin" />
                </TableCell>
              </TableRow>
            ) : ranked.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Sin datos.
                </TableCell>
              </TableRow>
            ) : (
              ranked.map((r, i) => {
                const sit = situacionOf(r.promedioGeneral)
                const cual = cualitativoOf(r.promedioGeneral)
                return (
                  <TableRow key={r.studentId}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {i + 1}
                    </TableCell>
                    <TableCell className="font-medium">{r.fullName}</TableCell>
                    <TableCell className="text-center font-semibold text-univalle">
                      {r.promedioGeneral.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      {cual.code} — {cual.label}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={cn(situacionClass(sit))}>
                        {sit === "APROBADO" ? "Aprobado" : "Reprobado"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
