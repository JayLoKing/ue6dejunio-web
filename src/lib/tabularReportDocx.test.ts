import { Packer } from "docx"
import JSZip from "jszip"
import { describe, expect, it } from "vitest"

import { tabularReportDocxOf } from "./tabularReportDocx"
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

/**
 * Lee el documento generado como lo que es: un zip. `word/document.xml` es el único lugar donde se
 * puede comprobar que el texto llegó — una aserción sobre el objeto que devuelve el builder sigue
 * pasando sobre un archivo que Word abre vacío.
 */
const documentXmlOf = async (blob: Blob): Promise<string> => {
  const zip = await JSZip.loadAsync(await blob.arrayBuffer())
  return (await zip.file("word/document.xml")?.async("string")) ?? ""
}

const render = async (
  overrides: Partial<Parameters<typeof tabularReportDocxOf>[0]> = {}
): Promise<string> => {
  const doc = tabularReportDocxOf({
    school,
    title: "REPORTE DE PORCENTAJE DE ASISTENCIA",
    subtitles: ["Curso: Primero A", "Gestión 2026 — Primer trimestre"],
    columns: [
      { header: "N°", width: 600 },
      { header: "Estudiante", width: 4000 },
      { header: "Asistencia", width: 1400, align: "center" },
    ],
    rows: [
      ["1", "Ana Aguilar", "66.7%"],
      ["2", "Luis Zambrana", "—"],
    ],
    ...overrides,
  })
  return documentXmlOf(await Packer.toBlob(doc))
}

describe("tabularReportDocxOf", () => {
  it("escribe el título y el membrete de la unidad educativa", async () => {
    const xml = await render()

    expect(xml).toContain("REPORTE DE PORCENTAJE DE ASISTENCIA")
    expect(xml).toContain("Unidad Educativa 6 de Junio")
    expect(xml).toContain("Distrito 3")
  })

  /** El documento tiene que decir de qué curso y de qué alcance habla, o no se puede contrastar. */
  it("escribe cada subtítulo de alcance", async () => {
    const xml = await render()

    expect(xml).toContain("Curso: Primero A")
    expect(xml).toContain("Primer trimestre")
  })

  it("escribe los encabezados de columna y cada fila", async () => {
    const xml = await render()

    expect(xml).toContain("Estudiante")
    expect(xml).toContain("Ana Aguilar")
    expect(xml).toContain("66.7%")
    expect(xml).toContain("Luis Zambrana")
  })

  /**
   * Un reporte sin filas se emite igual, con su encabezado y una leyenda. Fallar o devolver nada
   * dejaría a la persona sin saber si el curso no tiene a nadie o si el sistema se rompió.
   */
  it("emite el documento aunque no haya filas", async () => {
    const xml = await render({
      rows: [],
      emptyLabel: "Sin estudiantes en el curso.",
    })

    expect(xml).toContain("REPORTE DE PORCENTAJE DE ASISTENCIA")
    expect(xml).toContain("Sin estudiantes en el curso.")
  })

  /** El pie con la firma del Director: el documento se entrega y alguien lo tiene que firmar. */
  it("cierra con la firma del Director", async () => {
    const xml = await render()

    expect(xml).toContain("Juan Ortuño")
  })

  /** Sin Director cargado no se inventa un nombre, pero la línea de firma sigue estando. */
  it("deja la línea de firma sin nombre cuando no hay Director cargado", async () => {
    const xml = await render({ school: { ...school, directorName: null } })

    expect(xml).toContain("Director")
    expect(xml).not.toContain("Juan Ortuño")
  })
})
