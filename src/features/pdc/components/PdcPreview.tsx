import { Fragment } from "react"

import { cn } from "@/lib/utils"
import type { Institution } from "@/features/institution/types"
import type { Adaptation } from "@/features/adaptation/types"

import type { Pdc, PdcEntry, PdcSubject } from "../types"
import { areaLine, spellDate, teacherLine, trimesterName } from "../utils/heading"

/** The id the print stylesheet and the Word export both reach for. */
export const PDC_DOCUMENT_ID = "pdc-document"

/** Blank slots read as the form's own empty cell rather than as missing data. */
function orBlank(value: string | null | undefined) {
  return value && value.trim() !== "" ? value : ""
}

/** The blocks in the order the form prints them. */
function inPrintedOrder(subjects: PdcSubject[]) {
  return [...subjects].sort((a, b) => a.displayOrder - b.displayOrder)
}

/*
 * The measurements below are the template's own, read out of `Plantilla PDC_Primaria.docx`:
 * Arial Narrow throughout, 11pt for the title and the tables, 10pt for the two section rules,
 * 9pt for the reference table and the holistic objective. The two greens are the fills Word
 * stores — E2EFD9 over the development tables, A8D08D over the significant adaptations.
 */
const CELL = "pdc-cell border border-black px-2 py-1 align-top"
const HEAD = `${CELL} pdc-head bg-[#E2EFD9] font-bold`
const HEAD_ADAPTATION = `${CELL} pdc-head-adapt bg-[#A8D08D] font-bold`
/** The narrow left column of the reference table, where the form prints the field names. */
const LABEL = `${CELL} pdc-label font-bold w-[1%] whitespace-nowrap`
/** The reference table and the objective are set two points smaller than the rest of the form. */
const SMALL = "pdc-small text-[9pt]"
/** "1. DATOS REFERENCIALES" and "2. DESARROLLO" sit between the two sizes. */
const RULE = "pdc-rule text-[10pt] font-bold"

function MomentsCell({ entry }: { entry: PdcEntry }) {
  const moments = [
    ["PRÁCTICA", entry.practice],
    ["TEORÍA", entry.theory],
    ["VALORACIÓN", entry.valuation],
    ["PRODUCCIÓN", entry.production],
  ] as const

  return (
    <td className={CELL}>
      {moments.map(([label, value]) =>
        value && value.trim() !== "" ? (
          <Fragment key={label}>
            <span className="pdc-strong font-bold">{label}: </span>
            <span className="whitespace-pre-wrap">{value}</span>
            <br />
          </Fragment>
        ) : null,
      )}
    </td>
  )
}

function CriteriaCell({ entry }: { entry: PdcEntry }) {
  // Three, not four. The form evaluates on SER, SABER and HACER; the fourth dimension the rest of
  // the system grades on has no column here, and printing it would invent one.
  const criteria = [
    ["SER", entry.criteriaBeing],
    ["SABER", entry.criteriaKnowing],
    ["HACER", entry.criteriaDoing],
  ] as const

  return (
    <td className={CELL}>
      {criteria.map(([label, value]) =>
        value && value.trim() !== "" ? (
          <Fragment key={label}>
            <span className="pdc-strong font-bold">{label}: </span>
            <span className="whitespace-pre-wrap">{value}</span>
            <br />
          </Fragment>
        ) : null,
      )}
    </td>
  )
}

/**
 * One subject's table: the six columns of the form, with the learning objective spanning every
 * week of the subject the way the printed cell is merged down the block.
 */
function SubjectTable({ subject, active }: { subject: PdcSubject; active: boolean }) {
  const weeks = [...subject.entries].sort((a, b) => a.displayOrder - b.displayOrder)
  const rows = weeks.length === 0 ? 1 : weeks.length

  return (
    <table className={cn("w-full table-fixed border-collapse", active && "outline outline-2 outline-univalle")}>
      <thead>
        {/*
          The band is a row of this table rather than a box above it. As two elements they were two
          borders with a gap between them; as one table they share the grid, which is how the
          template draws it — the heading and the columns are the same frame.
        */}
        <tr>
          <th colSpan={6} className={`${CELL} pdc-band bg-[#E2EFD9] text-center font-normal`}>
            <span className="pdc-strong block font-bold">
              Área de saberes y conocimiento: {subject.knowledgeArea ?? "Sin área"}
            </span>
            <span className="block">{orBlank(subject.subjectName)}</span>
          </th>
        </tr>
        <tr>
          <th className={`${HEAD} w-[12%]`}>Objetivo de aprendizaje</th>
          <th className={`${HEAD} w-[18%]`}>Contenidos</th>
          <th className={`${HEAD} w-[30%]`}>Momentos del proceso formativo</th>
          <th className={`${HEAD} w-[12%]`}>Recursos</th>
          <th className={`${HEAD} w-[7%]`}>Periodos</th>
          <th className={HEAD}>Criterios de evaluación</th>
        </tr>
      </thead>
      <tbody>
        {weeks.length === 0 ? (
          <tr>
            <td className={`${CELL} whitespace-pre-wrap`}>{orBlank(subject.learningObjective)}</td>
            <td className={CELL} />
            <td className={CELL} />
            <td className={CELL} />
            <td className={CELL} />
            <td className={CELL} />
          </tr>
        ) : (
          weeks.map((entry, index) => (
            <tr key={entry.id}>
              {index === 0 ? (
                <td rowSpan={rows} className={`${CELL} whitespace-pre-wrap`}>
                  {orBlank(subject.learningObjective)}
                </td>
              ) : null}
              <td className={CELL}>
                <span className="pdc-strong font-bold">{entry.weekLabel}</span>
                <span className="block whitespace-pre-wrap">{orBlank(entry.contents)}</span>
              </td>
              <MomentsCell entry={entry} />
              <td className={`${CELL} whitespace-pre-wrap`}>{orBlank(entry.resources)}</td>
              <td className={`${CELL} text-center`}>{entry.periods ?? ""}</td>
              <CriteriaCell entry={entry} />
            </tr>
          ))
        )}
        <tr>
          <td colSpan={6} className={CELL}>
            {/*
              The title alone. What the template prints between parentheses tells the teacher who
              the row is for, which is guidance for filling the form rather than part of the
              document — it lives on the field in the wizard now.
            */}
            <span className="pdc-strong font-bold">ADAPTACIONES CURRICULARES</span>
            <span className="block whitespace-pre-wrap">
              {orBlank(subject.generalAdaptations)}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  )
}

/**
 * The four columns the template prints, in its order: what was adapted, the condition it answers
 * to, how it was adapted, and how it is judged. The student is not among them — the form names the
 * case, not the child.
 */
function AdaptationRow({ adaptation }: { adaptation: Adaptation }) {
  const columns = [
    adaptation.adaptedContents,
    adaptation.conditionType,
    adaptation.adaptedMethodology,
    adaptation.adaptedCriteria,
  ]

  return (
    <tr>
      {columns.map((value, column) => (
        <td
          key={column}
          className={cn(CELL, "whitespace-pre-wrap", column === 0 && "h-8")}
        >
          {orBlank(value)}
        </td>
      ))}
    </tr>
  )
}

export interface PdcPreviewProps {
  plan: Pdc
  /** The school's heading. Absent while it is still being fetched. */
  institution?: Institution
  /**
   * The significant adaptations of this plan. Absent while they are being fetched, and empty for
   * every plan whose teacher had no student in that case.
   */
  adaptations?: Adaptation[]
  /** Highlights the block being edited, so the teacher sees where their typing lands. */
  activeSubjectId?: string | null
  /** How much of the sheet fits on screen. Printing ignores it: paper is always full size. */
  zoom?: number
}

/**
 * The plan as it is handed in — the official form, not a summary of it. It keeps a white sheet and
 * black type whatever theme the app is under, because what the teacher checks here is the document
 * that comes out of the printer.
 */
export function PdcPreview({
  plan,
  institution,
  adaptations = [],
  activeSubjectId,
  zoom = 1,
}: PdcPreviewProps) {
  const blocks = inPrintedOrder(plan.subjects)

  return (
    <article
      id={PDC_DOCUMENT_ID}
      // `zoom` rather than a transform: a scaled element keeps its unscaled footprint, so the
      // wrapper would reserve eleven inches whatever the teacher chose. The print stylesheet
      // overrides it, because paper has a size of its own.
      style={{ zoom }}
      // Letter landscape with half-inch margins, the page setup the template carries. The sheet
      // keeps its real size so what is on screen is what comes out of the printer; the panel around
      // it scrolls rather than the sheet shrinking to fit.
      className="w-[11in] min-h-[8.5in] shrink-0 bg-white p-[0.5in] text-[11pt] leading-snug text-black [font-family:'Arial_Narrow','Liberation_Sans_Narrow',Arial,sans-serif]"
    >
      {/*
        The heading is the template's own wording, not the level as the database spells it: the
        form says "EDUCACIÓN PRIMARIA COMUNITARIA VOCACIONAL" while the catalogue row reads
        "Primaria Comunitaria Vocacional". The row below prints what the database says.
      */}
      <header className="pdc-title mb-4 text-center font-bold">
        <p>EDUCACIÓN PRIMARIA COMUNITARIA VOCACIONAL</p>
        <p>PLAN DE DESARROLLO CURRICULAR Nº {plan.planNumber}</p>
      </header>

      <h3 className={`mb-1 ${RULE}`}>1. DATOS REFERENCIALES</h3>
      <table className={`mb-5 w-full border-collapse ${SMALL}`}>
        <tbody>
          <tr>
            <td className={LABEL}>Distrito educativo</td>
            <td className={CELL}>{orBlank(institution?.district)}</td>
            <td className={LABEL}>Unidad educativa</td>
            <td className={CELL}>{orBlank(institution?.school)}</td>
          </tr>
          <tr>
            <td className={LABEL}>Nivel</td>
            <td className={CELL}>{orBlank(plan.levelName)}</td>
            <td className={LABEL}>Año de escolaridad</td>
            <td className={CELL}>{orBlank(plan.courseName)}</td>
          </tr>
          <tr>
            <td className={LABEL}>Director/a</td>
            <td className={CELL} colSpan={3}>{orBlank(institution?.directorName)}</td>
          </tr>
          <tr>
            <td className={LABEL}>Maestro/a</td>
            <td className={CELL} colSpan={3}>{teacherLine(plan)}</td>
          </tr>
          <tr>
            <td className={LABEL}>Áreas</td>
            <td className={CELL} colSpan={3}>{areaLine(plan)}</td>
          </tr>
          <tr>
            <td className={LABEL}>Trimestre</td>
            <td className={CELL} colSpan={3}>{trimesterName(plan.trimester)}</td>
          </tr>
          <tr>
            <td className={LABEL} />
            {/* The template sets both labels in bold and spaces the dates off them. */}
            <td className={CELL} colSpan={3}>
              <span className="pdc-strong font-bold">Del:</span>
              <span className="pdc-date ml-3 mr-12">{spellDate(plan.periodStart)}</span>
              <span className="pdc-strong font-bold">al:</span>
              <span className="pdc-date ml-3">{spellDate(plan.periodEnd)}</span>
            </td>
          </tr>
        </tbody>
      </table>

      <h3 className={`mb-1 ${RULE}`}>2. DESARROLLO</h3>
      <p className={`${SMALL} font-bold`}>Objetivo holístico de nivel</p>
      <p className={`mb-5 whitespace-pre-wrap text-justify ${SMALL}`}>
        {orBlank(plan.holisticObjective)}
      </p>

      {/*
        One headed table per block, not one heading per area. The form repeats the area over every
        subject it covers — a teacher running four subjects of Comunidad y Sociedad hands in four
        headed tables, not one heading with four tables under it.
      */}
      {blocks.map((subject) => (
        <div key={subject.id} className="mb-5">
          <SubjectTable subject={subject} active={subject.id === activeSubjectId} />
        </div>
      ))}

      <p className="pdc-band-adapt mb-1 border border-black bg-[#A8D08D] px-2 py-1 text-center font-bold">
        ADAPTACIONES CURRICULARES SIGNIFICATIVAS
      </p>
      <table className="mb-5 w-full table-fixed border-collapse">
        <thead>
          <tr>
            <th className={HEAD_ADAPTATION}>Contenido</th>
            <th className={HEAD_ADAPTATION}>
              Discapacidad/Talento extraordinario/TDH/TEA y otros
            </th>
            <th className={HEAD_ADAPTATION}>Adaptación</th>
            <th className={HEAD_ADAPTATION}>Criterio de evaluación</th>
          </tr>
        </thead>
        <tbody>
          {/*
            A month with no adaptation still hands in the empty row the teacher writes on by hand,
            the way the blank template does.
          */}
          {adaptations.length === 0 ? (
            <tr>
              <td className={`${CELL} h-8`} />
              <td className={CELL} />
              <td className={CELL} />
              <td className={CELL} />
            </tr>
          ) : (
            adaptations.map((adaptation) => (
              <AdaptationRow key={adaptation.id} adaptation={adaptation} />
            ))
          )}
        </tbody>
      </table>

      <h3 className="mb-1 font-bold">3. PRODUCTO FINAL DEL MES</h3>
      <p className="mb-5 whitespace-pre-wrap">{orBlank(plan.finalProduct)}</p>

      <h3 className="mb-1 font-bold">BIBLIOGRAFÍA</h3>
      <p className="mb-10 whitespace-pre-wrap">{orBlank(plan.bibliography)}</p>

      <footer className="grid grid-cols-2 gap-16 text-center">
        <p className="pdc-sign border-t border-black pt-1">Firma del Maestro/a</p>
        <p className="pdc-sign border-t border-black pt-1">Sello y Firma del Director/a</p>
      </footer>
    </article>
  )
}
