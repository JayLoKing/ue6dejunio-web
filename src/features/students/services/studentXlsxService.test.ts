import JSZip from "jszip"
import { describe, expect, it } from "vitest"

import { parseNominaXlsx } from "./studentXlsxService"

const NS = 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"'

/** A minimal workbook: one sheet with a course, one empty sheet, and a shared string table. */
const buildWorkbook = async (): Promise<File> => {
  const zip = new JSZip()
  zip.file(
    "xl/sharedStrings.xml",
    `<sst ${NS}><si><t>CURSO:  SEGUNDO  A</t></si><si><t>PEREZ ROJAS ANA</t></si></sst>`
  )
  zip.file(
    "xl/worksheets/sheet1.xml",
    `<worksheet ${NS}><sheetData>` +
      `<row r="2"><c r="B2" t="s"><v>0</v></c></row>` +
      `<row r="3"><c r="A3"><v>1</v></c><c r="B3" t="s"><v>1</v></c></row>` +
      `</sheetData></worksheet>`
  )
  zip.file(
    "xl/worksheets/sheet2.xml",
    `<worksheet ${NS}><sheetData/></worksheet>`
  )
  const bytes = await zip.generateAsync({ type: "arraybuffer" })
  return new File([bytes], "nomina.xlsx", {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
}

describe("parseNominaXlsx", () => {
  it("reads the course blocks of every sheet in the workbook", async () => {
    const blocks = await parseNominaXlsx(await buildWorkbook())

    expect(blocks).toHaveLength(1)
    expect(blocks[0]).toMatchObject({ grade: "Segundo", parallel: "A" })
    expect(blocks[0].rows[0]).toMatchObject({
      lastNames: "PEREZ ROJAS",
      names: "ANA",
    })
  })

  it("refuses a file that is not a workbook", async () => {
    await expect(
      parseNominaXlsx(new File(["not a zip"], "nomina.xlsx"))
    ).rejects.toThrow(/no se pudo leer la planilla/i)
  })
})
