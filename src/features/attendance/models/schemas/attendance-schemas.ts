import { z } from "zod"

export const attendanceStatusSchema = z.enum([
  "Present",
  "Absent",
  "Excused",
  "Late",
])

export const registerAttendanceSchema = z.object({
  id_enrollment: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: attendanceStatusSchema,
})

export type RegisterAttendanceValues = z.infer<typeof registerAttendanceSchema>
