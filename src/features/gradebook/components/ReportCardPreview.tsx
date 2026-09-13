import { Fragment } from "react"

import type { Institution } from "@/features/institution/types"

import { formatMark } from "../utils/annualMarks"
import type { ReportCardArea, StudentReportCard } from "../types"

/** El id que el camino de impresión busca para sacar la hoja fuera de la aplicación. */
export const REPORT_CARD_DOCUMENT_ID = "report-card-document"

export interface ReportCardPreviewProps {
  card: StudentReportCard
  school: Institution
}

/*
 * Cada elemento con estilo lleva su clase `rc-*` además de las utilidades de Tailwind. Las
 * utilidades son para la pantalla; las `rc-*` son lo único que sobrevive cuando el marcado se
 * entrega a la ventana de impresión, donde no hay Tailwind que las resuelva.
 */
const CELL = "rc-cell border border-black px-2 py-1 align-middle"
const HEAD = `${CELL} rc-head bg-[#DEEAF6] font-bold text-center`

function HeadingLine({ label, value }: { label: string; value: string }) {
  return (
    <td className="pr-3 pb-0.5 align-top">
      <span className="rc-label font-bold">{label}</span> {value}
    </td>
  )
}

function AreaRow({ area }: { area: ReportCardArea }) {
  return (
    <tr>
      <td className={CELL}>{area.subjectName}</td>
      <td className={`${CELL} rc-center text-center`}>
        {formatMark(area.trimester1)}
      </td>
      <td className={`${CELL} rc-center text-center`}>
        {formatMark(area.trimester2)}
      </td>
      <td className={`${CELL} rc-center text-center`}>
        {formatMark(area.trimester3)}
      </td>
      <td className={`${CELL} rc-center rc-strong text-center font-semibold`}>
        {formatMark(area.average)}
      </td>
    </tr>
  )
}

/**
 * La hoja LIBRETA tal como la escuela la imprime: el encabezado de la unidad educativa, el
 * estudiante con su código RUDE, las áreas agrupadas bajo su campo de saberes, y el cierre con el
 * promedio anual en numeral y literal.
 *
 * Presentacional a propósito. Todos los números los calcula la API, incluidos los conteos de áreas
 * aprobadas y reprobadas. Recontarlos acá desde las filas dibujadas haría que un área sin nota ese
 * trimestre cuente como reprobada, que es decirle a un padre que su hijo reprobó una materia que
 * nadie calificó.
 */
export function ReportCardPreview({ card, school }: ReportCardPreviewProps) {
  const outcomes = [1, 2, 3].map(
    (trimester) =>
      card.trimesterOutcomes.find((o) => o.trimester === trimester) ?? {
        trimester,
        passedAreas: 0,
        failedAreas: 0,
      }
  )

  return (
    <div
      id={REPORT_CARD_DOCUMENT_ID}
      className="mx-auto w-full max-w-[900px] bg-white p-6 text-[10pt] text-black"
    >
      <p className="rc-title mb-0.5 text-center text-[13pt] font-bold uppercase">
        Libreta Escolar
      </p>
      <p className="rc-level mb-4 text-center text-[11pt] font-semibold">
        {school.educationLevel}
      </p>

      <table className="rc-heading mb-3 w-full">
        <tbody>
          <tr>
            <HeadingLine label="Unidad Educativa:" value={school.school} />
            <HeadingLine label="Departamento:" value={school.department} />
          </tr>
          <tr>
            <HeadingLine label="Distrito Educativo:" value={school.district} />
            <HeadingLine label="Dependencia:" value={school.dependency} />
          </tr>
          <tr>
            <HeadingLine label="Turno:" value={school.shift} />
            <HeadingLine label="Gestión:" value={String(card.year)} />
          </tr>
        </tbody>
      </table>

      <table className="rc-student mb-3 w-full border border-black">
        <tbody>
          <tr>
            <HeadingLine label="Código RUDE:" value={card.rudeCode} />
            <HeadingLine
              label="Año de Escolaridad:"
              value={`${card.gradeName} "${card.parallelName}"`}
            />
          </tr>
          <tr>
            <td className="pr-3 pb-0.5 align-top" colSpan={2}>
              <span className="rc-label font-bold">Apellidos y Nombres:</span>{" "}
              {card.fullName}
            </td>
          </tr>
        </tbody>
      </table>

      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={`${HEAD} w-[34%]`} rowSpan={2}>
              Campos de Saberes y Conocimientos / Áreas Curriculares
            </th>
            <th className={HEAD} colSpan={4}>
              Valoración Cuantitativa
            </th>
          </tr>
          <tr>
            <th className={HEAD}>1er. Trim.</th>
            <th className={HEAD}>2do. Trim.</th>
            <th className={HEAD}>3ro. Trim.</th>
            <th className={HEAD}>Promedio Anual</th>
          </tr>
        </thead>
        <tbody>
          {card.fields.length === 0 ? (
            <tr>
              <td className={`${CELL} rc-center text-center`} colSpan={5}>
                Sin áreas calificadas.
              </td>
            </tr>
          ) : (
            card.fields.map((field, index) => (
              <Fragment key={`${field.fieldName ?? "sin-campo"}-${index}`}>
                <tr>
                  <td
                    className={`${CELL} rc-field bg-[#F2F2F2] font-bold`}
                    colSpan={5}
                  >
                    {/* Un área cuyo grupo se desactivó queda sin campo. Sus notas se imprimen
                        igual: se pusieron, y una libreta que pierde una materia en silencio es
                        peor que una con una fila sin título. */}
                    {field.fieldName ?? "Otras áreas"}
                  </td>
                </tr>
                {field.areas.map((area) => (
                  <AreaRow key={area.classGroupId} area={area} />
                ))}
              </Fragment>
            ))
          )}

          <tr>
            <td className={`${CELL} rc-strong font-bold`}>
              Promedio Trimestral
            </td>
            {card.trimesterAverages.map((average, i) => (
              <td
                key={i}
                className={`${CELL} rc-center rc-strong text-center font-semibold`}
              >
                {formatMark(average)}
              </td>
            ))}
            <td className={`${CELL} rc-center rc-strong text-center font-bold`}>
              {formatMark(card.finalAverage, 0)}
            </td>
          </tr>
          <tr>
            <td className={`${CELL} rc-strong font-bold`}>
              Total de Áreas Reprobadas
            </td>
            {outcomes.map((outcome) => (
              <td
                key={outcome.trimester}
                className={`${CELL} rc-center text-center`}
              >
                {outcome.failedAreas}
              </td>
            ))}
            <td className={CELL} />
          </tr>
        </tbody>
      </table>

      <p className="rc-literal mt-3">
        <span className="rc-label font-bold">Promedio Anual (literal):</span>{" "}
        {card.finalAverageInWords}
      </p>

      <table className="rc-signatures mt-16 w-full">
        <tbody>
          <tr>
            <td className="w-1/2 px-6 text-center">
              <p className="rc-sign border-t border-black pt-1">
                Firma del Asesor(a)
              </p>
            </td>
            <td className="w-1/2 px-6 text-center">
              {/* La línea se imprime igual sin Director en funciones; lo que no puede es llevar
                  el nombre de alguien que no está en el cargo. */}
              <p className="rc-sign border-t border-black pt-1">
                Firma del Director U.E.
                {school.directorName ? ` — ${school.directorName}` : ""}
              </p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
