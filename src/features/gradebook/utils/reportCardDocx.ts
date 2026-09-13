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

import { formatMark } from "./annualMarks"
import type {
  ReportCardArea,
  ReportCardField,
  StudentReportCard,
} from "../types"

/*
 * The sheet's own measurements, the same ones `reportCardDocument.ts` declares for paper. Sizes are
 * in half-points because that is the unit Word stores them in: 20 is 10pt.
 */
const FONT = "Arial Narrow"
const BODY = 20
const LEVEL = 22
const TITLE = 26
/** The fill over the column headings, and the lighter one over each field of knowledge. */
const BLUE = "DEEAF6"
const GREY = "F2F2F2"

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
/** The student's box is one frame with no grid inside it, the way the sheet draws it. */
const FRAME_ONLY = {
  top: SINGLE,
  bottom: SINGLE,
  left: SINGLE,
  right: SINGLE,
  insideHorizontal: NONE,
  insideVertical: NONE,
} as const

/** The area column against the four mark columns, in the proportions the sheet prints. */
const COLUMNS = [3600, 1728, 1728, 1728, 1728]

interface TextOptions {
  bold?: boolean
  size?: number
  alignment?: (typeof AlignmentType)[keyof typeof AlignmentType]
}

function text(value: string, options: TextOptions = {}): Paragraph {
  return new Paragraph({
    alignment: options.alignment,
    children: [
      new TextRun({
        text: value,
        bold: options.bold ?? false,
        size: options.size ?? BODY,
        font: FONT,
      }),
    ],
  })
}

/**
 * A field name and what it holds, on one line.
 *
 * <p>Two runs rather than two cells: the heading of this sheet is a list of labelled values, not a
 * grid, and a column of labels would draw a table the school's form does not have.
 */
function labelled(label: string, value: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: label, bold: true, size: BODY, font: FONT }),
      new TextRun({ text: ` ${value}`, size: BODY, font: FONT }),
    ],
  })
}

interface CellOptions {
  children: Paragraph[]
  fill?: string
  columnSpan?: number
  rowSpan?: number
  borders?: TableCell["options"]["borders"]
}

function cell({
  children,
  fill,
  columnSpan,
  rowSpan,
  borders,
}: CellOptions): TableCell {
  return new TableCell({
    children,
    columnSpan,
    rowSpan,
    borders,
    verticalAlign: VerticalAlign.CENTER,
    shading: fill
      ? { type: ShadingType.CLEAR, color: "auto", fill }
      : undefined,
    margins: { top: 40, bottom: 40, left: 80, right: 80 },
  })
}

function table(
  rows: TableRow[],
  columnWidths: number[],
  borders: typeof ALL_BORDERS | typeof NO_BORDERS | typeof FRAME_ONLY
): Table {
  return new Table({
    rows,
    columnWidths,
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders,
  })
}

/** The school's heading, the same six fields every official document of the school opens with. */
function headingTable(school: Institution, year: number): Table {
  const pair = (label: string, value: string) =>
    cell({ children: [labelled(label, value)] })
  const row = (pairs: [string, string][]) =>
    new TableRow({
      children: pairs.map(([label, value]) => pair(label, value)),
    })

  return table(
    [
      row([
        ["Unidad Educativa:", school.school],
        ["Departamento:", school.department],
      ]),
      row([
        ["Distrito Educativo:", school.district],
        ["Dependencia:", school.dependency],
      ]),
      row([
        ["Turno:", school.shift],
        ["Gestión:", String(year)],
      ]),
    ],
    [5256, 5256],
    NO_BORDERS
  )
}

function studentTable(card: StudentReportCard): Table {
  return table(
    [
      new TableRow({
        children: [
          cell({ children: [labelled("Código RUDE:", card.rudeCode)] }),
          cell({
            children: [
              labelled(
                "Año de Escolaridad:",
                `${card.gradeName} "${card.parallelName}"`
              ),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          cell({
            columnSpan: 2,
            children: [labelled("Apellidos y Nombres:", card.fullName)],
          }),
        ],
      }),
    ],
    [5256, 5256],
    FRAME_ONLY
  )
}

function areaRow(area: ReportCardArea): TableRow {
  const mark = (value: number | null, bold = false) =>
    cell({
      children: [
        text(formatMark(value), { bold, alignment: AlignmentType.CENTER }),
      ],
    })

  return new TableRow({
    children: [
      cell({ children: [text(area.subjectName)] }),
      mark(area.trimester1),
      mark(area.trimester2),
      mark(area.trimester3),
      mark(area.average, true),
    ],
  })
}

/**
 * The field of knowledge as its own banded row, with its areas under it.
 *
 * <p>An area whose group was deactivated has no field. Its marks are printed anyway: they were
 * given, and a libreta that loses a subject in silence is worse than one with an untitled row.
 */
function fieldRows(field: ReportCardField): TableRow[] {
  return [
    new TableRow({
      children: [
        cell({
          columnSpan: 5,
          fill: GREY,
          children: [text(field.fieldName ?? "Otras áreas", { bold: true })],
        }),
      ],
    }),
    ...field.areas.map(areaRow),
  ]
}

function marksTable(card: StudentReportCard): Table {
  const head = (
    label: string,
    span?: { rowSpan?: number; columnSpan?: number }
  ) =>
    cell({
      fill: BLUE,
      rowSpan: span?.rowSpan,
      columnSpan: span?.columnSpan,
      children: [text(label, { bold: true, alignment: AlignmentType.CENTER })],
    })

  const rows: TableRow[] = [
    new TableRow({
      children: [
        head("Campos de Saberes y Conocimientos / Áreas Curriculares", {
          rowSpan: 2,
        }),
        head("Valoración Cuantitativa", { columnSpan: 4 }),
      ],
    }),
    new TableRow({
      children: [
        head("1er. Trim."),
        head("2do. Trim."),
        head("3ro. Trim."),
        head("Promedio Anual"),
      ],
    }),
  ]

  if (card.fields.length === 0) {
    rows.push(
      new TableRow({
        children: [
          cell({
            columnSpan: 5,
            children: [
              text("Sin áreas calificadas.", {
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        ],
      })
    )
  } else {
    for (const field of card.fields) {
      rows.push(...fieldRows(field))
    }
  }

  const centred = (value: string, bold = false) =>
    cell({ children: [text(value, { bold, alignment: AlignmentType.CENTER })] })

  rows.push(
    new TableRow({
      children: [
        cell({ children: [text("Promedio Trimestral", { bold: true })] }),
        ...card.trimesterAverages.map((average) =>
          centred(formatMark(average), true)
        ),
        // No decimals on the annual average, the way the school signs the sheet.
        centred(formatMark(card.finalAverage, 0), true),
      ],
    })
  )

  /*
   * The counts come from the API, never from the rows above. Recounting them here would make an
   * area left ungraded that trimester count as failed, which tells a parent their child failed a
   * subject nobody marked.
   */
  const outcomes = [1, 2, 3].map(
    (trimester) =>
      card.trimesterOutcomes.find((o) => o.trimester === trimester) ?? {
        trimester,
        passedAreas: 0,
        failedAreas: 0,
      }
  )

  rows.push(
    new TableRow({
      children: [
        cell({ children: [text("Total de Áreas Reprobadas", { bold: true })] }),
        ...outcomes.map((outcome) => centred(String(outcome.failedAreas))),
        cell({ children: [text("")] }),
      ],
    })
  )

  return table(rows, COLUMNS, ALL_BORDERS)
}

function signatures(school: Institution): Table {
  // The line is printed with no Director in office; what it cannot carry is the name of somebody
  // who does not hold the post.
  const director = school.directorName
    ? `Firma del Director U.E. — ${school.directorName}`
    : "Firma del Director U.E."

  const signature = (label: string) =>
    new TableCell({
      borders: { top: SINGLE, bottom: NONE, left: NONE, right: NONE },
      margins: { top: 40, left: 240, right: 240 },
      children: [text(label, { alignment: AlignmentType.CENTER })],
    })

  return new Table({
    columnWidths: [5256, 5256],
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    rows: [
      new TableRow({
        children: [signature("Firma del Asesor(a)"), signature(director)],
      }),
    ],
  })
}

export interface ReportCardDocxParams {
  card: StudentReportCard
  school: Institution
}

/**
 * The libreta as a real Office document.
 *
 * <p>Written from the card rather than from the markup on screen, so what Word opens does not
 * depend on a stylesheet that never travelled with it. Every number is the API's, including the
 * counts of passed and failed areas — this writes the sheet, it does not compute it.
 *
 * <p>Portrait, unlike the PDC: the libreta is a column of areas, not a weekly grid.
 */
export function reportCardDocxOf({
  card,
  school,
}: ReportCardDocxParams): Document {
  const children = [
    text("LIBRETA ESCOLAR", {
      bold: true,
      size: TITLE,
      alignment: AlignmentType.CENTER,
    }),
    text(school.educationLevel, {
      bold: true,
      size: LEVEL,
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({ children: [] }),
    headingTable(school, card.year),
    new Paragraph({ children: [] }),
    studentTable(card),
    new Paragraph({ children: [] }),
    marksTable(card),
    new Paragraph({ children: [] }),
    labelled("Promedio Anual (literal):", card.finalAverageInWords),
    new Paragraph({ children: [] }),
    new Paragraph({ children: [] }),
    new Paragraph({ children: [] }),
    signatures(school),
  ]

  return new Document({
    styles: {
      default: {
        document: { run: { font: FONT, size: BODY, color: "000000" } },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              width: convertInchesToTwip(8.5),
              height: convertInchesToTwip(11),
            },
            margin: {
              top: convertInchesToTwip(0.6),
              right: convertInchesToTwip(0.6),
              bottom: convertInchesToTwip(0.6),
              left: convertInchesToTwip(0.6),
            },
          },
        },
        children,
      },
    ],
  })
}
