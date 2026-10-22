/**
 * The subject attendance screen shows what is already saved. It used to render the month grid from
 * local clicks alone, so a technical teacher opening a subject with a month of session marks saw an
 * empty grid, and a mark made today could not be told apart from a day nobody had recorded.
 * Lives outside `src/routes` on purpose: the router plugin reads every file there as a route.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import {
  AxiosError,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios"
import type { ComponentType } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { httpClient } from "@/lib/axios"

const context = vi.hoisted(() => ({
  current: {} as Record<string, unknown>,
}))

vi.mock("@/features/auth/hooks/useCurrentContext", () => ({
  useCurrentContext: () => context.current,
}))

vi.mock("@/features/courses/hooks/useCourses", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useCourseStudents: () => ({
    data: {
      content: [
        { courseEnrollmentId: "ce-1", fullName: "Ana Quispe" },
        { courseEnrollmentId: "ce-2", fullName: "Luis Mamani" },
      ],
    },
    isLoading: false,
  }),
}))

import { Route as AttendanceRoute } from "@/routes/_app/attendance.lazy"

const Attendance = AttendanceRoute.options.component as ComponentType

// A Thursday in August; only Date is faked so react-query keeps its real timers.
const TODAY = new Date(2026, 7, 27)

const technicalTeacher = {
  isLoading: false,
  isDirector: false,
  isSecretary: false,
  isTeacher: true,
  isTechnical: true,
  homeroomCourseId: null,
  classGroups: [
    {
      id: "g-tec",
      courseId: "c-5a",
      gradeName: "Quinto",
      parallelName: "A",
      subjectId: "s-tec",
      subjectName: "Técnica Tecnológica",
      teacherId: "t-1",
      teacherName: "Docente",
      active: true,
    },
  ],
}

const SESSION_ROWS = {
  content: [
    {
      courseEnrollmentId: "ce-1",
      studentId: "st-1",
      fullName: "Ana Quispe",
      attendances: [
        { id: "a-1", date: "2026-08-03", status: "Present" },
        { id: "a-2", date: "2026-08-04", status: "Late" },
        // Another month: the grid of August must not pick it up.
        { id: "a-3", date: "2026-07-31", status: "Absent" },
      ],
    },
    {
      courseEnrollmentId: "ce-2",
      studentId: "st-2",
      fullName: "Luis Mamani",
      attendances: [{ id: "a-4", date: "2026-08-03", status: "Excused" }],
    },
  ],
  page: 1,
  size: 200,
  total: 2,
  totalPages: 1,
}

const requests: InternalAxiosRequestConfig[] = []
let originalAdapter: typeof httpClient.defaults.adapter

/**
 * Answers the subject's attendance read and nothing else. Every other request fails by throwing,
 * the way axios's own adapters reject: returning an error status would skip the error pipeline.
 */
const serverAdapter: AxiosAdapter = async (config) => {
  requests.push(config)
  if (config.url === "/gradebook/attendance/session") {
    return {
      status: 200,
      statusText: "OK",
      data: SESSION_ROWS,
      headers: {},
      config,
    } as AxiosResponse
  }
  const response = {
    status: 404,
    statusText: "",
    data: {},
    headers: {},
    config,
  } as AxiosResponse
  throw new AxiosError(
    "Request failed with status code 404",
    AxiosError.ERR_BAD_REQUEST,
    config,
    null,
    response
  )
}

function renderPage() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={qc}>
      <Attendance />
    </QueryClientProvider>
  )
}

const cell = (student: string, iso: string) =>
  screen.getByRole("button", { name: new RegExp(`^${student}, ${iso}:`) })

describe("Subject attendance of a technical teacher", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(TODAY)
    context.current = technicalTeacher
    requests.length = 0
    originalAdapter = httpClient.defaults.adapter
    httpClient.defaults.adapter = serverAdapter
  })

  afterEach(() => {
    httpClient.defaults.adapter = originalAdapter
    vi.useRealTimers()
  })

  it("shows the session marks already saved for the selected subject and month", async () => {
    renderPage()

    await waitFor(() =>
      expect(cell("Ana Quispe", "2026-08-04")).toHaveTextContent("R")
    )
    expect(cell("Ana Quispe", "2026-08-03")).toHaveTextContent("P")
    expect(cell("Luis Mamani", "2026-08-03")).toHaveTextContent("L")
    expect(cell("Luis Mamani", "2026-08-04")).toHaveTextContent("·")

    const read = requests.find((r) => r.url === "/gradebook/attendance/session")
    expect(read?.params).toMatchObject({ id_class_group: "g-tec" })
  })
})
