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

import {
  fmtMark,
  fmtPct,
  PEDAGOGICAL_REPORT_CLOSING,
  pedagogicalReportTitle,
} from "./pedagogicalReport"
import type {
  FailingStudentRow,
  GenderTally,
  PedagogicalReport,
} from "../types"

/*
 * Las medidas de la hoja, las mismas que `pedagogicalReportDocument.ts` declara para el papel. Los
 * tamaños van en medios puntos porque es la unidad en que Word los guarda: 22 es 11pt.
 */
const FONT = "Arial"
const BODY = 22
const TITLE = 26
/** El relleno gris de los encabezados de columna del formulario. */
const GREY = "D9D9D9"

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

/** El ancho útil de la hoja carta con margen de una pulgada, en twips. */
const CONTENT_WIDTH = 9360
/** La sección I: una columna angosta de rótulos contra el valor. */
const REFERENCE_COLUMNS = [2600, CONTENT_WIDTH - 2600]
/** La sección III: doce columnas iguales, cuatro por grupo. */
const STATS_COLUMNS = Array.from({ length: 12 }, () => CONTENT_WIDTH / 12)
/** El cuadro IV, en la proporción que imprime el formulario. */
const FAILING_COLUMNS = [560, 1900, 1600, 900, 2900, 1500]

/** Un valor ausente deja la celda vacía del formulario, no la palabra "null". */
function orBlank(value: string | null | undefined): string {
  return value && value.trim() !== "" ? value : ""
}

interface TextOptions {
  bold?: boolean
  size?: number
  alignment?: (typeof AlignmentType)[keyof typeof AlignmentType]
}

/**
 * Lo que el docente escribió, con sus saltos de línea intactos.
 *
 * Un run no guarda saltos: Word almacena el salto como elemento propio, así que la prosa de tres
 * párrafos llegaría al archivo como un párrafo corrido.
 */
function runsFrom(value: string, options: TextOptions = {}): TextRun[] {
  return value.split("\n").map(
    (line, index) =>
      new TextRun({
        text: line,
        bold: options.bold ?? false,
        size: options.size ?? BODY,
        font: FONT,
        break: index === 0 ? 0 : 1,
      })
  )
}

function text(value: string, options: TextOptions = {}): Paragraph {
  return new Paragraph({
    alignment: options.alignment,
    children: runsFrom(value, options),
  })
}

interface CellOptions {
  children: Paragraph[]
  fill?: string
  columnSpan?: number
}

function cell({ children, fill, columnSpan }: CellOptions): TableCell {
  return new TableCell({
    children,
    columnSpan,
    verticalAlign: VerticalAlign.TOP,
    shading: fill
      ? { type: ShadingType.CLEAR, color: "auto", fill }
      : undefined,
    margins: { top: 40, bottom: 40, left: 80, right: 80 },
  })
}

function table(rows: TableRow[], columnWidths: number[]): Table {
  return new Table({
    rows,
    columnWidths,
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: ALL_BORDERS,
  })
}

function sectionRule(label: string): Paragraph {
  return new Paragraph({
    spacing: { before: 240, after: 80 },
    children: runsFrom(label, { bold: true }),
  })
}

/** Sección I. La escuela sale de `/institution`; el curso, del informe. */
function referenceTable(sheet: PedagogicalReport, school: Institution): Table {
  const row = (label: string, value: string) =>
    new TableRow({
      children: [
        cell({ children: [text(label, { bold: true })] }),
        cell({ children: [text(value)] }),
      ],
    })

  return table(
    [
      row("Unidad educativa:", school.school),
      row("Distrito educativo:", school.district),
      row("Departamento:", school.department),
      row("Gestión:", String(sheet.year)),
      row("Nivel de educación:", school.educationLevel),
      row("Año de escolaridad:", sheet.gradeName),
      row("Paralelos:", `“${sheet.parallelName}”`),
      // Un curso sin docente de aula imprime la fila vacía: inventar un nombre en el documento que
      // esa persona firma es peor que entregarlo en blanco.
      row("Docente:", orBlank(sheet.homeroomTeacherName)),
    ],
    REFERENCE_COLUMNS
  )
}

/** Sección II. Las dos cajas de prosa, lado a lado como las imprime el formulario. */
function proseTable(sheet: PedagogicalReport): Table {
  const head = (label: string) =>
    cell({
      fill: GREY,
      children: [text(label, { bold: true, alignment: AlignmentType.CENTER })],
    })

  return table(
    [
      new TableRow({ children: [head("LOGROS"), head("DIFICULTADES")] }),
      new TableRow({
        children: [
          cell({
            children: [
              text(orBlank(sheet.achievements), {
                alignment: AlignmentType.JUSTIFIED,
              }),
            ],
          }),
          cell({
            children: [
              text(orBlank(sheet.difficulties), {
                alignment: AlignmentType.JUSTIFIED,
              }),
            ],
          }),
        ],
      }),
    ],
    [CONTENT_WIDTH / 2, CONTENT_WIDTH / 2]
  )
}

/**
 * Sección III. Los tres grupos en columnas, con `V | M | T | %` bajo cada uno.
 *
 * Los conteos vienen de la API y no cierran entre sí a propósito: un estudiante que nadie calificó
 * es efectivo sin estar aprobado ni reprobado. Esto escribe la hoja, no la recalcula.
 */
function statsTable(sheet: PedagogicalReport): Table {
  const head = (label: string, columnSpan?: number) =>
    cell({
      fill: GREY,
      columnSpan,
      children: [text(label, { bold: true, alignment: AlignmentType.CENTER })],
    })

  const centred = (value: string) =>
    cell({ children: [text(value, { alignment: AlignmentType.CENTER })] })

  const tallyCells = (tally: GenderTally) => [
    centred(String(tally.male)),
    centred(String(tally.female)),
    centred(String(tally.total)),
    centred(fmtPct(tally.percentage)),
  ]

  return table(
    [
      new TableRow({
        children: [
          head("EFECTIVOS", 4),
          head("ESTUDIANTES APROBADOS", 4),
          head("ESTUDIANTES REPROBADOS", 4),
        ],
      }),
      new TableRow({
        children: [1, 2, 3].flatMap(() => [
          head("V"),
          head("M"),
          head("T"),
          head("%"),
        ]),
      }),
      new TableRow({
        children: [
          ...tallyCells(sheet.stats.effective),
          ...tallyCells(sheet.stats.passed),
          ...tallyCells(sheet.stats.failed),
        ],
      }),
    ],
    STATS_COLUMNS
  )
}

/**
 * Una fila del cuadro IV.
 *
 * El área y su nota son dos columnas del formulario, y cada nota va a la altura del área que la
 * reprobó: un párrafo por línea en cada celda, no una lista con un guion en medio.
 */
function failingRow(student: FailingStudentRow): TableRow {
  return new TableRow({
    children: [
      cell({
        children: [
          text(String(student.number), { alignment: AlignmentType.CENTER }),
        ],
      }),
      cell({ children: [text(student.fullName)] }),
      cell({
        children: student.failedAreas.map((area) => text(area.subjectName)),
      }),
      cell({
        children: student.failedAreas.map((area) =>
          text(fmtMark(area.mark), { alignment: AlignmentType.CENTER })
        ),
      }),
      cell({
        children: [
          text(orBlank(student.actions), {
            alignment: AlignmentType.JUSTIFIED,
          }),
        ],
      }),
      cell({ children: [text(orBlank(student.verificationSource))] }),
    ],
  })
}

function failingTable(sheet: PedagogicalReport): Table {
  const head = (label: string) =>
    cell({
      fill: GREY,
      children: [text(label, { bold: true, alignment: AlignmentType.CENTER })],
    })

  const headRow = new TableRow({
    children: [
      head("N°"),
      head("APELLIDOS Y NOMBRES"),
      head("ÁREAS REPROBADAS"),
      // Partido a mano. La columna mide 900 twips y la palabra entera no entra; Word no divide
      // palabras por su cuenta, así que la escribía hasta montarse sobre la columna de acciones y
      // el encabezado se leía corrido. El ancho no se toca: lo manda la grilla del formulario, y
      // lo que esta columna no use lo necesita la de acciones, que lleva una frase entera.
      head("CALIFI-\nCACIÓN"),
      head("Acciones, estrategias y/o adaptaciones curriculares realizadas."),
      head("Fuente de Verificación."),
    ],
  })

  // El curso sin reprobados entrega el cuadro igual, con la fila en blanco que trae el formulario.
  const bodyRows =
    sheet.failingStudents.length === 0
      ? [
          new TableRow({
            children: FAILING_COLUMNS.map(() => cell({ children: [text("")] })),
          }),
        ]
      : sheet.failingStudents.map(failingRow)

  return table([headRow, ...bodyRows], FAILING_COLUMNS)
}

/** El cierre: la línea de firma del docente de aula, sin nombre si el curso no tiene uno. */
function signature(sheet: PedagogicalReport): Table {
  return new Table({
    columnWidths: [CONTENT_WIDTH / 2, CONTENT_WIDTH / 2],
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    rows: [
      new TableRow({
        children: [
          new TableCell({ children: [text("")], borders: NO_BORDERS }),
          new TableCell({
            borders: { top: SINGLE, bottom: NONE, left: NONE, right: NONE },
            margins: { top: 40, left: 240, right: 240 },
            children: [
              text(orBlank(sheet.homeroomTeacherName), {
                alignment: AlignmentType.CENTER,
              }),
              text("Docente de aula", { alignment: AlignmentType.CENTER }),
            ],
          }),
        ],
      }),
    ],
  })
}

export interface PedagogicalReportDocxParams {
  sheet: PedagogicalReport
  school: Institution
}

/**
 * El informe pedagógico como documento de Office de verdad.
 *
 * Escrito desde el informe y no desde el marcado de la pantalla, para que lo que abre Word no
 * dependa de una hoja de estilos que nunca viajó con él. Los conteos de la sección III y las áreas
 * reprobadas de la IV son de la API: esto escribe la hoja, no la calcula.
 */
export function pedagogicalReportDocxOf({
  sheet,
  school,
}: PedagogicalReportDocxParams): Document {
  const children = [
    // El documento arranca en el título, sin membrete, y es una decisión tomada y no un pendiente.
    //
    // El ejemplar que dejó la escuela trae un `word/header1.xml` con tres imágenes y las líneas
    // DIRECCIÓN DEPARTAMENTAL / DISTRITAL SACABA / UNIDAD EDUCATIVA "6 DE JUNIO". No se reproduce:
    // esos tres datos ya salen impresos como campos en la sección I, leídos de la institución, así
    // que el membrete los repetiría; y los logos son decoración institucional que el repositorio no
    // tiene y que nadie pidió. Confirmado con el usuario el 2026-09-25.
    //
    // Si alguna vez se agrega, van embebidos como data URI: la ventana de impresión no comparte el
    // origen de la aplicación y una ruta relativa sale rota.
    text(pedagogicalReportTitle(sheet), {
      bold: true,
      size: TITLE,
      alignment: AlignmentType.CENTER,
    }),
    sectionRule("I . DATOS REFERENCIALES:"),
    referenceTable(sheet, school),
    sectionRule("II . LOGROS Y DIFICULTADES."),
    proseTable(sheet),
    sectionRule("III . ESTADÍSTICA DE ESTUDIANTES APROBADOS Y REPROBADOS."),
    statsTable(sheet),
    sectionRule("IV . CUADRO DE DESCRIPCIÓN DE ESTUDIANTES REPROBADOS."),
    failingTable(sheet),
    new Paragraph({ children: [] }),
    text(PEDAGOGICAL_REPORT_CLOSING, { alignment: AlignmentType.JUSTIFIED }),
    text("Atentamente:"),
    new Paragraph({ children: [] }),
    new Paragraph({ children: [] }),
    signature(sheet),
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
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
            },
          },
        },
        children,
      },
    ],
  })
}
