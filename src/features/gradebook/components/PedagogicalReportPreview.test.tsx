import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import type { Institution } from "@/features/institution/types"

import { PedagogicalReportPreview } from "./PedagogicalReportPreview"
import type { PedagogicalReport } from "../types"

const school: Institution = {
  district: "Sacaba",
  school: "6 de Junio",
  directorName: "Rojas Mario",
  department: "Cochabamba",
  dependency: "Fiscal",
  shift: "Mañana",
  educationLevel: "Primaria Comunitaria Vocacional",
}

const tally = (male: number, female: number, percentage: number | null) => ({
  male,
  female,
  total: male + female,
  percentage,
})

const sheet = (over: Partial<PedagogicalReport> = {}): PedagogicalReport => ({
  courseId: "c-1",
  gradeName: "Quinto",
  parallelName: "B",
  year: 2026,
  homeroomTeacherName: "Mamani Rosa",
  trimester: 1,
  exists: true,
  achievements: "Leen en voz alta.",
  difficulties: "Les cuesta la división.",
  stats: {
    effective: tally(15, 15, 100),
    passed: tally(12, 11, 78),
    failed: tally(3, 4, 22),
  },
  failingStudents: [
    {
      number: 1,
      courseEnrollmentId: "ce-1",
      studentId: "st-1",
      fullName: "Quispe Ana",
      failedAreas: [
        { classGroupId: "cg-1", subjectName: "Matemática", mark: 45 },
        { classGroupId: "cg-2", subjectName: "Lengua", mark: 48 },
      ],
      actions: "Refuerzo los martes.",
      verificationSource: "Cuaderno de refuerzo.",
    },
  ],
  updatedAt: "2026-09-14T10:00:00",
  ...over,
})

describe("PedagogicalReportPreview", () => {
  /** El documento se titula con el trimestre en letras, no con su número. */
  it("titula la hoja con el trimestre escrito como lo escribe la escuela", () => {
    render(
      <PedagogicalReportPreview
        sheet={sheet({ trimester: 3 })}
        school={school}
      />
    )

    expect(
      screen.getByText(/INFORME PEDAGÓGICO DEL TERCER TRIMESTRE/i)
    ).toBeInTheDocument()
  })

  /**
   * La sección I mezcla dos fuentes: la escuela sale de `/institution` y el curso del informe.
   * Ninguna de las dos se escribe a mano en esta pantalla.
   */
  it("arma los datos referenciales con la escuela y el curso", () => {
    render(<PedagogicalReportPreview sheet={sheet()} school={school} />)

    const referenciales = screen.getByRole("table", {
      name: /datos referenciales/i,
    })
    expect(referenciales).toHaveTextContent("6 de Junio")
    expect(referenciales).toHaveTextContent("Sacaba")
    expect(referenciales).toHaveTextContent("Cochabamba")
    expect(referenciales).toHaveTextContent("Primaria Comunitaria Vocacional")
    expect(referenciales).toHaveTextContent("Quinto")
    expect(referenciales).toHaveTextContent("2026")
    expect(referenciales).toHaveTextContent("Mamani Rosa")
  })

  /** La prosa que el docente tipea es el documento: llega tal cual, no resumida. */
  it("imprime los logros y las dificultades tal como se escribieron", () => {
    render(
      <PedagogicalReportPreview
        sheet={sheet({
          achievements: "Primera línea.\nSegunda línea.",
          difficulties: "Faltan mucho.",
        })}
        school={school}
      />
    )

    const prosa = screen.getByRole("table", { name: /logros y dificultades/i })
    expect(prosa).toHaveTextContent("Primera línea.")
    expect(prosa).toHaveTextContent("Segunda línea.")
    expect(prosa).toHaveTextContent("Faltan mucho.")
  })

  /**
   * Los tres grupos van en columnas y no en filas: así lo imprime el formulario de la escuela, con
   * `V | M | T | %` repetido bajo cada uno.
   */
  it("imprime la estadística en los tres grupos de columnas del formulario", () => {
    render(<PedagogicalReportPreview sheet={sheet()} school={school} />)

    const estadistica = screen.getByRole("table", { name: /estadística/i })
    const cifras = within(estadistica)
      .getAllByRole("cell")
      .map((cell) => cell.textContent?.trim())

    // El porcentaje va con sus dos decimales: la API lo calcula, y 78,26 impreso como 78 es un
    // número que nadie midió.
    expect(cifras).toEqual([
      "15",
      "15",
      "30",
      "100,00",
      "12",
      "11",
      "23",
      "78,00",
      "3",
      "4",
      "7",
      "22,00",
    ])
  })

  /** Sin nómina efectiva no hay porcentaje, y un cero diría que nadie aprobó. */
  it("deja el porcentaje en raya cuando no hay con qué calcularlo", () => {
    render(
      <PedagogicalReportPreview
        sheet={sheet({
          stats: {
            effective: tally(0, 0, null),
            passed: tally(0, 0, null),
            failed: tally(0, 0, null),
          },
        })}
        school={school}
      />
    )

    const estadistica = screen.getByRole("table", { name: /estadística/i })
    expect(within(estadistica).getAllByText("—")).toHaveLength(3)
  })

  /**
   * El área y su nota son dos columnas del formulario, no una celda con un guion en medio. Cada
   * nota se imprime a la altura del área que la reprobó.
   */
  it("separa el área de su calificación en dos columnas", () => {
    render(<PedagogicalReportPreview sheet={sheet()} school={school} />)

    const fila = screen.getByRole("row", { name: /Quispe Ana/ })
    const celdas = within(fila).getAllByRole("cell")

    expect(celdas[2]).toHaveTextContent("Matemática")
    expect(celdas[2]).toHaveTextContent("Lengua")
    expect(celdas[2]).not.toHaveTextContent("45")
    expect(celdas[3]).toHaveTextContent("45")
    expect(celdas[3]).toHaveTextContent("48")
  })

  /**
   * 51 es el umbral de aprobación. Redondear a entero convierte un 50,6 reprobado en un 51 que se
   * lee aprobado, dentro del cuadro de los reprobados.
   */
  it("no redondea una nota reprobada hasta el umbral de aprobación", () => {
    render(
      <PedagogicalReportPreview
        sheet={sheet({
          failingStudents: [
            {
              number: 1,
              courseEnrollmentId: "ce-1",
              studentId: "st-1",
              fullName: "Quispe Ana",
              failedAreas: [
                { classGroupId: "cg-1", subjectName: "Matemática", mark: 50.6 },
              ],
              actions: null,
              verificationSource: null,
            },
          ],
        })}
        school={school}
      />
    )

    const fila = screen.getByRole("row", { name: /Quispe Ana/ })
    expect(within(fila).getByText("50,6")).toBeInTheDocument()
  })

  /**
   * Un curso sin reprobados entrega el cuadro igual, con su fila en blanco: es el formulario que la
   * escuela firma, y una leyenda en su lugar no es el documento.
   */
  it("entrega el cuadro IV en blanco cuando nadie reprobó", () => {
    render(
      <PedagogicalReportPreview
        sheet={sheet({ failingStudents: [] })}
        school={school}
      />
    )

    const cuadro = screen.getByRole("table", {
      name: /estudiantes reprobados/i,
    })
    // El encabezado y una fila vacía: el cuadro se imprime, no se reemplaza por un cartel.
    expect(within(cuadro).getAllByRole("row")).toHaveLength(2)
    expect(cuadro).not.toHaveTextContent(/Ningún estudiante/i)
  })

  /** La hoja la firma el docente de aula, y sin docente asignado la línea se imprime sola. */
  it("cierra con la firma del docente de aula", () => {
    render(<PedagogicalReportPreview sheet={sheet()} school={school} />)

    expect(screen.getByText(/Atentamente/i)).toBeInTheDocument()

    const firma = screen.getByRole("table", { name: /firma/i })
    expect(within(firma).getByText("Mamani Rosa")).toBeInTheDocument()
    expect(within(firma).getByText(/Docente de aula/)).toBeInTheDocument()
  })
})
