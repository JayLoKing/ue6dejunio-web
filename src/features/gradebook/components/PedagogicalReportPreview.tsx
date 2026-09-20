import { Fragment } from "react"

import type { Institution } from "@/features/institution/types"

import { fmtMark, fmtPct, pedagogicalReportTitle } from "../utils/pedagogicalReport"
import type {
  FailingStudentRow,
  GenderTally,
  PedagogicalReport,
} from "../types"

/** El id que el camino de impresión busca para sacar la hoja fuera de la aplicación. */
export const PEDAGOGICAL_REPORT_DOCUMENT_ID = "pedagogical-report-document"

/*
 * Cada elemento con estilo lleva su clase `ip-*` además de las utilidades de Tailwind. Las
 * utilidades son para la pantalla; las `ip-*` son lo único que sobrevive cuando el marcado se
 * entrega a la ventana de impresión, donde no hay Tailwind que las resuelva.
 */
const CELL = "ip-cell border border-black px-2 py-1 align-top"
const HEAD = `${CELL} ip-head bg-[#D9D9D9] text-center font-bold`
/** La columna angosta de rótulos de la sección I. */
const LABEL = `${CELL} ip-label w-[1%] font-bold whitespace-nowrap`
const RULE = "ip-rule mt-4 mb-1 font-bold"

/** Un valor ausente deja la celda vacía del formulario, no un cartel dentro del documento. */
function orBlank(value: string | null | undefined): string {
  return value && value.trim() !== "" ? value : ""
}

function ReferenceRow({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className={LABEL}>{label}</td>
      <td className={CELL}>{value}</td>
    </tr>
  )
}

/** Las cuatro celdas `V | M | T | %` de un grupo de la sección III. */
function TallyCells({ tally }: { tally: GenderTally }) {
  return (
    <>
      <td className={`${CELL} ip-center text-center`}>{tally.male}</td>
      <td className={`${CELL} ip-center text-center`}>{tally.female}</td>
      <td className={`${CELL} ip-center text-center`}>{tally.total}</td>
      <td className={`${CELL} ip-center text-center`}>
        {fmtPct(tally.percentage)}
      </td>
    </>
  )
}

/**
 * Una fila del cuadro IV.
 *
 * El área y su nota son dos columnas del formulario, y cada nota se imprime a la altura del área
 * que la reprobó. Juntarlas en una sola celda — "Matemática — 45" — sería otro documento.
 */
function FailingRow({ student }: { student: FailingStudentRow }) {
  return (
    <tr>
      <td className={`${CELL} ip-center text-center`}>{student.number}</td>
      <td className={CELL}>{student.fullName}</td>
      <td className={CELL}>
        {student.failedAreas.map((area) => (
          <p key={area.classGroupId}>{area.subjectName}</p>
        ))}
      </td>
      <td className={`${CELL} ip-center text-center`}>
        {student.failedAreas.map((area) => (
          <p key={area.classGroupId}>{fmtMark(area.mark)}</p>
        ))}
      </td>
      <td className={`${CELL} ip-wrap whitespace-pre-wrap`}>
        {orBlank(student.actions)}
      </td>
      <td className={`${CELL} ip-wrap whitespace-pre-wrap`}>
        {orBlank(student.verificationSource)}
      </td>
    </tr>
  )
}

export interface PedagogicalReportPreviewProps {
  sheet: PedagogicalReport
  school: Institution
}

/**
 * El informe pedagógico tal como la escuela lo entrega a Dirección: las cuatro secciones del
 * formulario, no un resumen de ellas.
 *
 * Presentacional a propósito. Los conteos de la sección III y las áreas reprobadas de la IV los
 * calcula la API; recontarlos acá desde lo dibujado haría que un estudiante que nadie calificó
 * aparezca reprobado. Lo único que sale del formulario en vivo es la prosa y lo escrito por
 * estudiante, que es justamente lo que el docente está tipeando mientras mira esta hoja.
 */
export function PedagogicalReportPreview({
  sheet,
  school,
}: PedagogicalReportPreviewProps) {
  return (
    <div
      id={PEDAGOGICAL_REPORT_DOCUMENT_ID}
      className="mx-auto w-full max-w-[900px] bg-white p-8 text-[11pt] leading-snug text-black"
    >
      <p className="ip-title mb-4 text-center text-[13pt] font-bold uppercase">
        {pedagogicalReportTitle(sheet)}
      </p>

      <h3 className={RULE}>I . DATOS REFERENCIALES:</h3>
      <table
        aria-label="I. Datos referenciales"
        className="w-full border-collapse"
      >
        <tbody>
          <ReferenceRow label="Unidad educativa:" value={school.school} />
          <ReferenceRow label="Distrito educativo:" value={school.district} />
          <ReferenceRow label="Departamento:" value={school.department} />
          <ReferenceRow label="Gestión:" value={String(sheet.year)} />
          <ReferenceRow
            label="Nivel de educación:"
            value={school.educationLevel}
          />
          <ReferenceRow label="Año de escolaridad:" value={sheet.gradeName} />
          <ReferenceRow
            label="Paralelos:"
            value={`“${sheet.parallelName}”`}
          />
          {/* Un curso sin docente de aula imprime la fila vacía; inventar un nombre en el
              documento que firma esa persona es peor que entregarlo en blanco. */}
          <ReferenceRow
            label="Docente:"
            value={orBlank(sheet.homeroomTeacherName)}
          />
        </tbody>
      </table>

      <h3 className={RULE}>II . LOGROS Y DIFICULTADES.</h3>
      <table
        aria-label="II. Logros y dificultades"
        className="w-full table-fixed border-collapse"
      >
        <thead>
          <tr>
            <th className={HEAD}>LOGROS</th>
            <th className={HEAD}>DIFICULTADES</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            {/* Los saltos de línea del docente son suyos: el documento los imprime como los
                escribió, no como un párrafo corrido. */}
            <td
              className={`${CELL} ip-wrap ip-prose h-40 text-justify whitespace-pre-wrap`}
            >
              {orBlank(sheet.achievements)}
            </td>
            <td
              className={`${CELL} ip-wrap ip-prose h-40 text-justify whitespace-pre-wrap`}
            >
              {orBlank(sheet.difficulties)}
            </td>
          </tr>
        </tbody>
      </table>

      <h3 className={RULE}>
        III . ESTADÍSTICA DE ESTUDIANTES APROBADOS Y REPROBADOS.
      </h3>
      {/*
        Los tres grupos van en columnas, con `V | M | T | %` repetido bajo cada uno: es la grilla
        del formulario. Los conteos no cierran entre sí y no se fuerzan — un estudiante que nadie
        calificó es efectivo sin estar aprobado ni reprobado, y V + M puede quedar debajo de T
        porque el género puede no estar registrado.
      */}
      <table
        aria-label="III. Estadística de estudiantes aprobados y reprobados"
        className="w-full table-fixed border-collapse"
      >
        <thead>
          <tr>
            <th className={HEAD} colSpan={4}>
              EFECTIVOS
            </th>
            <th className={HEAD} colSpan={4}>
              ESTUDIANTES APROBADOS
            </th>
            <th className={HEAD} colSpan={4}>
              ESTUDIANTES REPROBADOS
            </th>
          </tr>
          <tr>
            {["efectivos", "aprobados", "reprobados"].map((group) => (
              <Fragment key={group}>
                <th className={HEAD}>V</th>
                <th className={HEAD}>M</th>
                <th className={HEAD}>T</th>
                <th className={HEAD}>%</th>
              </Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <TallyCells tally={sheet.stats.effective} />
            <TallyCells tally={sheet.stats.passed} />
            <TallyCells tally={sheet.stats.failed} />
          </tr>
        </tbody>
      </table>

      <h3 className={RULE}>
        IV . CUADRO DE DESCRIPCIÓN DE ESTUDIANTES REPROBADOS.
      </h3>
      <table
        aria-label="IV. Cuadro de descripción de estudiantes reprobados"
        className="ip-failing w-full table-fixed border-collapse"
      >
        {/*
          Los anchos van en un `colgroup` y no en cada `th`: es lo único que el papel conserva, donde
          no hay Tailwind que resuelva las utilidades del preview.
        */}
        <colgroup>
          <col className="w-[6%]" />
          <col className="w-[20%]" />
          <col className="w-[17%]" />
          <col className="w-[9%]" />
          <col className="w-[32%]" />
          <col className="w-[16%]" />
        </colgroup>
        <thead>
          <tr>
            <th className={HEAD}>N°</th>
            <th className={HEAD}>APELLIDOS Y NOMBRES</th>
            <th className={HEAD}>ÁREAS REPROBADAS</th>
            <th className={HEAD}>CALIFICACIÓN</th>
            <th className={HEAD}>
              Acciones, estrategias y/o adaptaciones curriculares realizadas.
            </th>
            <th className={HEAD}>Fuente de Verificación.</th>
          </tr>
        </thead>
        <tbody>
          {/*
            Un curso sin reprobados entrega el cuadro igual, con la fila en blanco que el
            formulario trae. Un cartel en su lugar sería un documento distinto del que se firma.
          */}
          {sheet.failingStudents.length === 0 ? (
            <tr>
              <td className={`${CELL} h-8`} />
              <td className={CELL} />
              <td className={CELL} />
              <td className={CELL} />
              <td className={CELL} />
              <td className={CELL} />
            </tr>
          ) : (
            sheet.failingStudents.map((student) => (
              <FailingRow key={student.courseEnrollmentId} student={student} />
            ))
          )}
        </tbody>
      </table>

      <p className="ip-closing mt-6 text-justify">
        Este es lo que puedo dar fe, con respecto a mis estudiantes, saludo a
        usted con las consideraciones del caso.
      </p>
      <p className="mt-2">Atentamente:</p>

      <table aria-label="Firma" className="ip-signature mt-16 w-full">
        <tbody>
          <tr>
            <td className="w-1/2" />
            <td className="w-1/2 px-6 text-center">
              {/* La línea se imprime igual sin docente de aula asignado; lo que no puede llevar
                  es el nombre de alguien que no está a cargo del curso. */}
              <p className="ip-sign border-t border-black pt-1">
                {orBlank(sheet.homeroomTeacherName)}
              </p>
              <p>Docente de aula</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
