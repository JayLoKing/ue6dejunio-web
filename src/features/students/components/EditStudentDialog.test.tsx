import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { AxiosError, type AxiosResponse } from "axios"
import { beforeEach, describe, expect, it, vi } from "vitest"

const useStudentDetail = vi.hoisted(() => vi.fn())
const mutateAsync = vi.hoisted(() => vi.fn())

// The hooks are stubbed: these tests are about the form the dialog drives and what it sends.
vi.mock("../hooks/useStudent", () => ({
  useStudentDetail,
  useUpdateStudent: () => ({ mutateAsync, isPending: false }),
}))

import { EditStudentDialog } from "./EditStudentDialog"

/** A name-only student, as the school's xlsx leaves them. */
const incomplete = {
  id: "st-1",
  rudeCode: null,
  identityCard: null,
  names: "ANA",
  lastNames: "PEREZ ROJAS",
  birthDate: null,
  gender: null,
  status: "Effective",
  statusReason: null,
  statusNote: null,
  statusChangedAt: null,
  statusChangedById: null,
  statusChangedByName: null,
  incomplete: true,
}

const conflict = (message: string) =>
  new AxiosError("fail", "ERR_BAD_REQUEST", undefined, undefined, {
    status: 409,
    data: { message },
  } as AxiosResponse)

const open = (onClose = vi.fn()) => {
  render(<EditStudentDialog studentId="st-1" onClose={onClose} />)
  return onClose
}

beforeEach(() => {
  vi.clearAllMocks()
  useStudentDetail.mockReturnValue({
    data: incomplete,
    isLoading: false,
    isError: false,
  })
})

describe("EditStudentDialog", () => {
  it("starts from what the student already has", () => {
    open()

    expect(screen.getByLabelText("Apellidos")).toHaveValue("PEREZ ROJAS")
    expect(screen.getByLabelText("Nombres")).toHaveValue("ANA")
    expect(screen.getByLabelText("Código RUDE")).toHaveValue("")
  })

  // PUT replaces the whole record: an omitted field would clear it, so all six always go.
  it("sends the whole record, empty fields as null, and closes", async () => {
    mutateAsync.mockResolvedValueOnce({})
    const onClose = open()

    await userEvent.type(screen.getByLabelText("Código RUDE"), "8090123456")
    await userEvent.type(
      screen.getByLabelText("Fecha de nacimiento"),
      "2018-03-05"
    )
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }))

    expect(mutateAsync).toHaveBeenCalledWith({
      id: "st-1",
      payload: {
        rudeCode: "8090123456",
        identityCard: null,
        names: "ANA",
        lastNames: "PEREZ ROJAS",
        birthDate: "2018-03-05",
        gender: null,
      },
    })
    expect(onClose).toHaveBeenCalled()
  })

  it("requires the names and sends nothing without them", async () => {
    open()

    await userEvent.clear(screen.getByLabelText("Nombres"))
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }))

    expect(await screen.findByText("Nombres requeridos")).toBeInTheDocument()
    expect(mutateAsync).not.toHaveBeenCalled()
  })

  it("refuses a birth date that has not happened yet", async () => {
    open()

    await userEvent.type(
      screen.getByLabelText("Fecha de nacimiento"),
      "2999-01-01"
    )
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }))

    expect(
      await screen.findByText("La fecha de nacimiento debe ser pasada")
    ).toBeInTheDocument()
    expect(mutateAsync).not.toHaveBeenCalled()
  })

  it("shows why the API refused a RUDE or CI already taken, and stays open", async () => {
    mutateAsync.mockRejectedValueOnce(
      conflict("El RUDE 8090123456 ya pertenece a otro estudiante.")
    )
    const onClose = open()

    await userEvent.type(screen.getByLabelText("Código RUDE"), "8090123456")
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }))

    expect(
      await screen.findByText(
        "El RUDE 8090123456 ya pertenece a otro estudiante."
      )
    ).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
  })

  it("says so when the student could not be loaded", () => {
    useStudentDetail.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    })

    open()

    expect(
      screen.getByText("No se pudieron cargar los datos del estudiante.")
    ).toBeInTheDocument()
  })
})
