import {
  AlignmentType,
  BorderStyle,
  Document,
  PageOrientation,
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
import type { Adaptation } from "@/features/adaptation/types"

import type { Pdc, PdcEntry, PdcSubject } from "../types"
import { areaLine, spellDate, teacherLine, trimesterName } from "./heading"

/*
 * The template's own measurements, read out of `Plantilla PDC_Primaria.docx`. Sizes are in
 * half-points because that is the unit Word stores them in: 22 is 11pt.
 */
const FONT = "Arial Narrow"
const BODY = 22
const RULE = 20
const SMALL = 18
/** The fill over the development tables, and the darker one over the significant adaptations. */
const GREEN = "E2EFD9"
const GREEN_ADAPT = "A8D08D"

const SINGLE = { style: BorderStyle.SINGLE, size: 4, color: "000000" } as const
const ALL_BORDERS = {
  top: SINGLE,
  bottom: SINGLE,
  left: SINGLE,
  right: SINGLE,
  insideHorizontal: SINGLE,
  insideVertical: SINGLE,
} as const
const NO_BORDERS = {
  top: { style: BorderStyle.NONE, size: 0, color: "auto" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
  left: { style: BorderStyle.NONE, size: 0, color: "auto" },
  right: { style: BorderStyle.NONE, size: 0, color: "auto" },
  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
  insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
} as const

/** Blank slots read as the form's own empty cell rather than as the word "null". */
function orBlank(value: string | null | undefined): string {
  return value && value.trim() !== "" ? value : ""
}

/**
 * What the teacher typed, with their line breaks kept.
 *
 * <p>A run holds no newlines: Word stores a break as its own element, so text pasted into a weekly
 * cell over three lines would otherwise arrive as one paragraph.
 */
function runsFrom(value: string, bold = false, size = BODY): TextRun[] {
  const lines = value.split("\n")
  return lines.map(
    (line, index) =>
      new TextRun({
        text: line,
        bold,
        size,
        font: FONT,
        break: index === 0 ? 0 : 1,
      })
  )
}

function text(
  value: string,
  options: {
    bold?: boolean
    size?: number
    alignment?: (typeof AlignmentType)[keyof typeof AlignmentType]
  } = {}
): Paragraph {
  return new Paragraph({
    alignment: options.alignment,
    children: runsFrom(
      orBlank(value),
      options.bold ?? false,
      options.size ?? BODY
    ),
  })
}

interface CellOptions {
  children: Paragraph[]
  fill?: string
  columnSpan?: number
  rowSpan?: number
}

function cell({ children, fill, columnSpan, rowSpan }: CellOptions): TableCell {
  return new TableCell({
    children,
    columnSpan,
    rowSpan,
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

/** One labelled pair of the reference table: the field name, then what the plan says. */
function referenceRow(pairs: [string, string][]): TableRow {
  return new TableRow({
    children: pairs.flatMap(([label, value]) => [
      cell({ children: [text(label, { bold: true, size: SMALL })] }),
      cell({ children: [text(value, { size: SMALL })] }),
    ]),
  })
}

function referenceTable(plan: Pdc, institution?: Institution): Table {
  const wide = (label: string, value: string) =>
    new TableRow({
      children: [
        cell({ children: [text(label, { bold: true, size: SMALL })] }),
        cell({
          children: [text(value, { size: SMALL })],
          columnSpan: 3,
        }),
      ],
    })

  return table(
    [
      referenceRow([
        ["Distrito educativo", orBlank(institution?.district)],
        ["Unidad educativa", orBlank(institution?.school)],
      ]),
      referenceRow([
        ["Nivel", orBlank(plan.levelName)],
        ["Año de escolaridad", orBlank(plan.courseName)],
      ]),
      wide("Director/a", orBlank(institution?.directorName)),
      wide("Maestro/a", teacherLine(plan)),
      wide("Áreas", areaLine(plan)),
      wide("Trimestre", trimesterName(plan.trimester)),
      new TableRow({
        children: [
          cell({ children: [text("")] }),
          cell({
            columnSpan: 3,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Del: ",
                    bold: true,
                    size: SMALL,
                    font: FONT,
                  }),
                  new TextRun({
                    text: `${spellDate(plan.periodStart)}          `,
                    size: SMALL,
                    font: FONT,
                  }),
                  new TextRun({
                    text: "al: ",
                    bold: true,
                    size: SMALL,
                    font: FONT,
                  }),
                  new TextRun({
                    text: spellDate(plan.periodEnd),
                    size: SMALL,
                    font: FONT,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
    [2200, 5000, 2200, 5000]
  )
}

/** The four moments of the formative process, each named before what the teacher wrote for it. */
function momentsParagraphs(entry: PdcEntry): Paragraph[] {
  const moments: [string, string | null][] = [
    ["PRÁCTICA", entry.practice],
    ["TEORÍA", entry.theory],
    ["VALORACIÓN", entry.valuation],
    ["PRODUCCIÓN", entry.production],
  ]
  return labelled(moments)
}

/**
 * Three, not four. The form evaluates on SER, SABER and HACER; the fourth dimension the rest of the
 * system grades on has no column here, and printing it would invent one.
 */
function criteriaParagraphs(entry: PdcEntry): Paragraph[] {
  const criteria: [string, string | null][] = [
    ["SER", entry.criteriaBeing],
    ["SABER", entry.criteriaKnowing],
    ["HACER", entry.criteriaDoing],
  ]
  return labelled(criteria)
}

function labelled(pairs: [string, string | null][]): Paragraph[] {
  const written = pairs.filter(([, value]) => value && value.trim() !== "")
  if (written.length === 0) return [text("")]
  return written.map(
    ([label, value]) =>
      new Paragraph({
        children: [
          new TextRun({
            text: `${label}: `,
            bold: true,
            size: BODY,
            font: FONT,
          }),
          ...runsFrom(value ?? ""),
        ],
      })
  )
}

/*
 * The six columns of the weekly table, in twips, summing to the printable width — ten inches, which
 * is Letter on its side less the half-inch margins. They are the template's own proportions:
 * 12, 18, 30, 12, 7 and the rest.
 */
const SUBJECT_COLUMNS = [1728, 2592, 4320, 1728, 1008, 3024]

/**
 * One subject's table: the band that names its area, the six headed columns, a row per week, and
 * the block's general adaptations closing it.
 *
 * <p>The band is a row of this table rather than a box above it, the way the template draws it —
 * one frame, not a heading floating over a grid.
 */
function subjectTable(subject: PdcSubject): Table {
  const weeks = [...subject.entries].sort(
    (a, b) => a.displayOrder - b.displayOrder
  )
  const head = (label: string) =>
    cell({ children: [text(label, { bold: true })], fill: GREEN })

  const objective = [text(orBlank(subject.learningObjective))]
  const rows: TableRow[] = [
    new TableRow({
      children: [
        cell({
          columnSpan: 6,
          fill: GREEN,
          children: [
            text(
              `Área de saberes y conocimiento: ${subject.knowledgeArea ?? "Sin área"}`,
              { bold: true, alignment: AlignmentType.CENTER }
            ),
            text(orBlank(subject.subjectName), {
              alignment: AlignmentType.CENTER,
            }),
          ],
        }),
      ],
    }),
    new TableRow({
      children: [
        head("Objetivo de aprendizaje"),
        head("Contenidos"),
        head("Momentos del proceso formativo"),
        head("Recursos"),
        head("Periodos"),
        head("Criterios de evaluación"),
      ],
    }),
  ]

  if (weeks.length === 0) {
    rows.push(
      new TableRow({
        children: [
          cell({ children: objective }),
          ...Array.from({ length: 5 }, () => cell({ children: [text("")] })),
        ],
      })
    )
  } else {
    weeks.forEach((entry, index) => {
      const cells: TableCell[] = []
      // The objective is written once and merged down the block, the way the printed cell spans
      // every week of the subject. Merged cells are declared on the first row only.
      if (index === 0) {
        cells.push(cell({ children: objective, rowSpan: weeks.length }))
      }
      cells.push(
        cell({
          children: [
            text(entry.weekLabel, { bold: true }),
            text(orBlank(entry.contents)),
          ],
        }),
        cell({ children: momentsParagraphs(entry) }),
        cell({ children: [text(orBlank(entry.resources))] }),
        cell({
          children: [
            text(entry.periods === null ? "" : String(entry.periods), {
              alignment: AlignmentType.CENTER,
            }),
          ],
        }),
        cell({ children: criteriaParagraphs(entry) })
      )
      rows.push(new TableRow({ children: cells }))
    })
  }

  rows.push(
    new TableRow({
      children: [
        cell({
          columnSpan: 6,
          children: [
            text("ADAPTACIONES CURRICULARES", { bold: true }),
            text(orBlank(subject.generalAdaptations)),
          ],
        }),
      ],
    })
  )

  return table(rows, SUBJECT_COLUMNS)
}

/**
 * The significant adaptations, in the template's column order: what was adapted, the condition it
 * answers to, how it was adapted, and how it is judged. The student is not among them — the form
 * names the case, not the child.
 */
function adaptationsTable(adaptations: Adaptation[]): Table {
  const head = (label: string) =>
    cell({
      children: [text(label, { bold: true, alignment: AlignmentType.CENTER })],
      fill: GREEN_ADAPT,
    })

  const rows: TableRow[] = [
    new TableRow({
      children: [
        cell({
          columnSpan: 4,
          fill: GREEN_ADAPT,
          children: [
            text("ADAPTACIONES CURRICULARES SIGNIFICATIVAS", {
              bold: true,
              alignment: AlignmentType.CENTER,
            }),
          ],
        }),
      ],
    }),
    new TableRow({
      children: [
        head("Contenido"),
        head("Discapacidad/Talento extraordinario/TDH/TEA y otros"),
        head("Adaptación"),
        head("Criterio de evaluación"),
      ],
    }),
  ]

  // A month with no adaptation still hands in the empty row the teacher writes on by hand, the way
  // the blank template does.
  if (adaptations.length === 0) {
    rows.push(
      new TableRow({
        children: Array.from({ length: 4 }, () =>
          cell({ children: [text("")] })
        ),
      })
    )
  } else {
    for (const adaptation of adaptations) {
      rows.push(
        new TableRow({
          children: [
            cell({ children: [text(orBlank(adaptation.adaptedContents))] }),
            cell({ children: [text(orBlank(adaptation.conditionType))] }),
            cell({ children: [text(orBlank(adaptation.adaptedMethodology))] }),
            cell({ children: [text(orBlank(adaptation.adaptedCriteria))] }),
          ],
        })
      )
    }
  }

  return table(rows, [3600, 3600, 3600, 3600])
}

function signatures(): Table {
  return new Table({
    columnWidths: [7200, 7200],
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: { top: SINGLE },
            children: [
              text("Firma del Maestro/a", { alignment: AlignmentType.CENTER }),
            ],
          }),
          new TableCell({
            borders: { top: SINGLE },
            children: [
              text("Sello y Firma del Director/a", {
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        ],
      }),
    ],
  })
}

export interface PdcDocxParams {
  plan: Pdc
  institution?: Institution
  adaptations: Adaptation[]
}

/**
 * The plan as a real Office document.
 *
 * <p>Built from the plan rather than scraped off the screen. The old export saved the preview's
 * markup under a `.doc` name — a file Word would open and nothing else would, whose look depended
 * on a stylesheet that did not travel with it. This one is a package Word, LibreOffice and Google
 * Docs all read, and it is written from the same data the preview draws, so the two cannot drift.
 */
export function pdcDocxOf({
  plan,
  institution,
  adaptations,
}: PdcDocxParams): Document {
  const blocks = [...plan.subjects].sort(
    (a, b) => a.displayOrder - b.displayOrder
  )

  const children: (Paragraph | Table)[] = [
    // The template's own wording, not the level as the database spells it: the form says
    // "EDUCACIÓN PRIMARIA COMUNITARIA VOCACIONAL" while the catalogue row reads
    // "Primaria Comunitaria Vocacional". The reference table below prints what the database says.
    text("EDUCACIÓN PRIMARIA COMUNITARIA VOCACIONAL", {
      bold: true,
      alignment: AlignmentType.CENTER,
    }),
    text(`PLAN DE DESARROLLO CURRICULAR Nº ${plan.planNumber}`, {
      bold: true,
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({ children: [] }),
    text("1. DATOS REFERENCIALES", { bold: true, size: RULE }),
    referenceTable(plan, institution),
    new Paragraph({ children: [] }),
    text("2. DESARROLLO", { bold: true, size: RULE }),
    text("Objetivo holístico de nivel", { bold: true, size: SMALL }),
    text(orBlank(plan.holisticObjective), { size: SMALL }),
    new Paragraph({ children: [] }),
  ]

  // One headed table per block, not one heading per area: a teacher running four subjects of
  // Comunidad y Sociedad hands in four headed tables.
  for (const block of blocks) {
    children.push(subjectTable(block), new Paragraph({ children: [] }))
  }

  children.push(
    adaptationsTable(adaptations),
    new Paragraph({ children: [] }),
    text("3. PRODUCTO FINAL DEL MES", { bold: true }),
    text(orBlank(plan.finalProduct)),
    new Paragraph({ children: [] }),
    text("BIBLIOGRAFÍA", { bold: true }),
    text(orBlank(plan.bibliography)),
    new Paragraph({ children: [] }),
    new Paragraph({ children: [] }),
    signatures()
  )

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
              orientation: PageOrientation.LANDSCAPE,
              width: convertInchesToTwip(11),
              height: convertInchesToTwip(8.5),
            },
            margin: {
              top: convertInchesToTwip(0.5),
              right: convertInchesToTwip(0.5),
              bottom: convertInchesToTwip(0.5),
              left: convertInchesToTwip(0.5),
            },
          },
        },
        children,
      },
    ],
  })
}

