import { useMemo } from "react"
import { useQueries, useQueryClient } from "@tanstack/react-query"

import { AttendanceService } from "../services/attendanceService"
import { API_TO_CELL, type AttendanceCellStatus } from "../types"

export type MatrixData = Record<string, Record<string, AttendanceCellStatus>>

const inMonth = (iso: string, year: number, month: number): boolean => {
  const prefix = `${year}-${String(month).padStart(2, "0")}-`
  return iso.startsWith(prefix)
}

/**
 * Fetches saved attendance for every enrollment and builds
 * { enrollmentId: { isoDate: cellStatus } } limited to the given month.
 */
export function useAttendanceMatrix(
  enrollmentIds: string[],
  year: number,
  month: number,
) {
  const qc = useQueryClient()

  const results = useQueries({
    queries: enrollmentIds.map((id) => ({
      queryKey: ["attendance", "enrollment", id] as const,
      queryFn: () => AttendanceService.byEnrollment(id),
      enabled: Boolean(id),
      staleTime: 30_000,
    })),
  })

  const isLoading = results.some((r) => r.isLoading)
  // Signature changes whenever any enrollment's data is (re)fetched.
  const sig = results.map((r) => r.dataUpdatedAt).join("|")

  const data = useMemo<MatrixData>(() => {
    const out: MatrixData = {}
    results.forEach((r, idx) => {
      const id = enrollmentIds[idx]
      if (!id || !r.data) return
      const byDate: Record<string, AttendanceCellStatus> = {}
      for (const a of r.data) {
        if (!inMonth(a.date, year, month)) continue
        byDate[a.date] = API_TO_CELL[a.status]
      }
      out[id] = byDate
    })
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrollmentIds, year, month, sig])

  const refetch = () => {
    for (const id of enrollmentIds) {
      void qc.invalidateQueries({ queryKey: ["attendance", "enrollment", id] })
    }
  }

  return { data, isLoading, refetch }
}
