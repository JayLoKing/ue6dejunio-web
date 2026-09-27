import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

const saveBlob = vi.hoisted(() => vi.fn())
vi.mock("@/lib/saveBlob", () => ({ saveBlob }))

const toastError = vi.hoisted(() => vi.fn())
vi.mock("sonner", () => ({ toast: { error: toastError, success: vi.fn() } }))

import { ExportReportButton } from "./ExportReportButton"
import type { Institution } from "@/features/institution/types"

const school: Institution = {
  district: "Distrito 3",
  school: "Unidad Educativa 6 de Junio",
  directorName: "Juan Ortuño",
  department: "Cochabamba",
  dependency: "Fiscal",
  shift: "Mañana",
  educationLevel: "Primaria Comunitaria Vocacional",
}

const props = {
  school,
  title: "CUADRO DE HONOR",
  subtitles: ["Gestión 2026"],
  columns: [
    { header: "N°", width: 600 },
    { header: "Estudiante", width: 4000 },
  ],
  rows: [["1", "Ana Aguilar"]],
  filename: "cuadro-de-honor-2026",
}

describe("ExportReportButton", () => {
  beforeEach(() => {
    saveBlob.mockClear()
    toastError.mockClear()
  })

  it("baja el archivo con su nombre y extensión", async () => {
    render(<ExportReportButton {...props} />)

    await userEvent.click(
      screen.getByRole("button", { name: /exportar docx/i })
    )

    await waitFor(() => expect(saveBlob).toHaveBeenCalledTimes(1))
    expect(saveBlob.mock.calls[0][1]).toBe("cuadro-de-honor-2026.docx")
    expect(saveBlob.mock.calls[0][0]).toBeInstanceOf(Blob)
  })

  /**
   * El documento lleva el membrete de la unidad educativa. Emitirlo sin él daría una hoja con los
   * campos en blanco que alguien archivaría igual, así que el botón espera.
   */
  it("no deja exportar sin los datos de la unidad educativa", () => {
    render(<ExportReportButton {...props} school={undefined} />)

    expect(
      screen.getByRole("button", { name: /exportar docx/i })
    ).toBeDisabled()
  })

  it("acepta una etiqueta propia para el botón", () => {
    render(<ExportReportButton {...props} label="Exportar el podio" />)

    expect(
      screen.getByRole("button", { name: /exportar el podio/i })
    ).toBeInTheDocument()
  })
})

/**
 * Armar el documento puede fallar: la carga diferida de `docx` depende de la red y el armado corre
 * en el navegador. Sin aviso el único síntoma sería que el spinner se apaga y no aparece ningún
 * archivo, y la persona se queda esperando una descarga que nunca fue.
 */
describe("ExportReportButton, cuando escribir falla", () => {
  beforeEach(() => {
    saveBlob.mockClear()
    toastError.mockClear()
  })

  it("avisa en vez de apagar el spinner en silencio", async () => {
    saveBlob.mockImplementation(() => {
      throw new Error("no se pudo escribir")
    })

    render(<ExportReportButton {...props} />)
    await userEvent.click(
      screen.getByRole("button", { name: /exportar docx/i })
    )

    await waitFor(() => expect(toastError).toHaveBeenCalledTimes(1))
  })

  it("deja el botón disponible para reintentar", async () => {
    saveBlob.mockImplementation(() => {
      throw new Error("no se pudo escribir")
    })

    render(<ExportReportButton {...props} />)
    await userEvent.click(
      screen.getByRole("button", { name: /exportar docx/i })
    )

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /exportar docx/i })
      ).toBeEnabled()
    )
  })
})
