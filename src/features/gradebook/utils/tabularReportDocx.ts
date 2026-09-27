import {
  AlignmentType,
  BorderStyle,
  Document,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
  convertInchesToTwip,
} from "docx"

import type { Institution } from "@/features/institution/types"

/**
 * El documento DOCX de un reporte que es, en el fondo, una tabla.
 *
 * Cuatro de los reportes que los RF piden —asistencia, cuadro de honor, riesgo y el consolidado del
 * curso— son la misma hoja: membrete de la unidad educativa, título, de qué curso y alcance habla, la
 * tabla, y una firma. Sólo cambian las columnas. Escribirlos por separado habría sido copiar cuatro
 * veces las medidas del papel y los bordes, y a la cuarta ya no coincidirían.
 *
 * La libreta (`reportCardDocx`) y el informe pedagógico no pasan por acá a propósito: no son tablas,
 * son formularios oficiales con un armado propio que esta forma no describe.
 */

const FONT = "Arial Narrow"
const BODY = 20
const TITLE = 26
/** Los mismos rellenos que usa la libreta, para que los documentos se lean como del mismo sistema. */
const BLUE = "DEEAF6"

const SINGLE = { style: BorderStyle.SINGLE, size: 4, color: "000000" } as const
const NONE = { style: BorderStyle.NONE, size: 0, color: "auto" } as const

const ALL_BORDERS = {
  top: SINGLE,
  bottom: SINGLE,
  left: SINGLE,
  right: SINGLE,
  insideHorizontal: SINGLE,
  insideVertical: SINGLE,
} as const

const NO_BORDERS = {
  top: NONE,
  bottom: NONE,
  left: NONE,
  right: NONE,
  insideHorizontal: NONE,
  insideVertical: NONE,
} as const

export type ColumnAlign = "left" | "center" | "right"

export interface ReportColumn {
  header: string
  /** Ancho en twips. La suma de todos define la proporción de la tabla. */
  width: number
  align?: ColumnAlign
}

export interface TabularReportInput {
  school: Institution
  title: string
  /** Las líneas que dicen de qué habla el reporte: curso, gestión, alcance. */
  subtitles: string[]
  columns: ReportColumn[]
  /** Una fila por celda ya formateada. El builder no interpreta números ni fechas. */
  rows: string[][]
  /** Qué decir cuando no hay filas. Sin esto la tabla sale con sólo su encabezado. */
  emptyLabel?: string
}

const ALIGNMENT: Record<
  ColumnAlign,
  (typeof AlignmentType)[keyof typeof AlignmentType]
> = {
  left: AlignmentType.LEFT,
  center: AlignmentType.CENTER,
  right: AlignmentType.RIGHT,
}

interface TextOptions {
  bold?: boolean
  size?: number
  align?: ColumnAlign
}

const text = (value: string, options: TextOptions = {}): Paragraph =>
  new Paragraph({
    alignment: ALIGNMENT[options.align ?? "left"],
    children: [
      new TextRun({
        text: value,
        bold: options.bold ?? false,
        font: FONT,
        size: options.size ?? BODY,
      }),
    ],
  })

const headerCell = (column: ReportColumn): TableCell =>
  new TableCell({
    width: { size: column.width, type: WidthType.DXA },
    shading: { type: ShadingType.CLEAR, fill: BLUE, color: "auto" },
    verticalAlign: VerticalAlign.CENTER,
    children: [
      text(column.header, { bold: true, align: column.align ?? "center" }),
    ],
  })

const bodyCell = (value: string, column: ReportColumn): TableCell =>
  new TableCell({
    width: { size: column.width, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    children: [text(value, { align: column.align ?? "left" })],
  })

/**
 * El membrete. Dos columnas sin bordes, que es como lo imprimen los documentos oficiales de la
 * escuela: la etiqueta a la izquierda y el dato al lado.
 */
const letterhead = (school: Institution): Table =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    rows: (
      [
        ["Unidad Educativa:", school.school],
        ["Distrito Educativo:", school.district],
        ["Departamento:", school.department],
        ["Dependencia:", school.dependency],
        ["Turno:", school.shift],
        ["Nivel:", school.educationLevel],
      ] as const
    ).map(
      ([label, value]) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 2200, type: WidthType.DXA },
              borders: NO_BORDERS,
              children: [text(label, { bold: true })],
            }),
            new TableCell({
              borders: NO_BORDERS,
              children: [text(value)],
            }),
          ],
        })
    ),
  })

/**
 * La firma. Sin Director cargado la línea sigue estando y el nombre no se inventa: el documento se
 * entrega en papel y alguien lo firma a mano de todos modos.
 */
const signature = (school: Institution): Paragraph[] => [
  new Paragraph({ text: "" }),
  new Paragraph({ text: "" }),
  text("_______________________________", { align: "center" }),
  // La misma frase que firma la libreta, para que los dos documentos se lean como de la misma
  // escuela y no como de dos sistemas distintos.
  text(
    school.directorName
      ? `Firma del Director U.E. — ${school.directorName}`
      : "Firma del Director U.E.",
    { align: "center" }
  ),
]

export function tabularReportDocxOf(input: TabularReportInput): Document {
  const { school, title, subtitles, columns, rows, emptyLabel } = input

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: ALL_BORDERS,
    rows: [
      new TableRow({
        tableHeader: true,
        children: columns.map(headerCell),
      }),
      ...rows.map(
        (row) =>
          new TableRow({
            children: columns.map((column, index) =>
              bodyCell(row[index] ?? "", column)
            ),
          })
      ),
    ],
  })

  return new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.6),
              bottom: convertInchesToTwip(0.6),
              left: convertInchesToTwip(0.6),
              right: convertInchesToTwip(0.6),
            },
          },
        },
        children: [
          letterhead(school),
          new Paragraph({ text: "" }),
          text(title, { bold: true, size: TITLE, align: "center" }),
          ...subtitles.map((line) => text(line, { align: "center" })),
          new Paragraph({ text: "" }),
          table,
          // La leyenda va DEBAJO de la tabla y no en su lugar: así el documento sigue mostrando de
          // qué columnas hablaba, que es la mitad de lo que se quiere ver al abrir un reporte vacío.
          ...(rows.length === 0 && emptyLabel
            ? [
                new Paragraph({ text: "" }),
                text(emptyLabel, { align: "center" }),
              ]
            : []),
          ...signature(school),
        ],
      },
    ],
  })
}
