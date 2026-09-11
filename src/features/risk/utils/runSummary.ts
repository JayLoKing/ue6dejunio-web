import type { RunSummary } from "../types/risk"

export interface RunDescription {
  tone: "success" | "info"
  message: string
}

const plural = (n: number, one: string, many: string): string =>
  `${n} ${n === 1 ? one : many}`

/**
 * What to tell whoever pressed the button.
 *
 * The four counters exist so "nothing to predict" can be told apart from "nothing happened",
 * and the wording keeps them apart. A run early in the trimester predicts nobody — the model needs
 * a mark in all four dimensions — and announcing that as a success would have a teacher read an
 * empty risk column as good news about their students.
 */
export function describeRun(summary: RunSummary): RunDescription {
  const { considered, skipped, predicted, changed } = summary

  if (considered === 0) {
    return { tone: "info", message: "No hay estudiantes para evaluar." }
  }

  if (predicted === 0) {
    return {
      tone: "info",
      message:
        "Ningún estudiante tiene las cuatro dimensiones calificadas todavía. No se predijo a nadie.",
    }
  }

  const evaluated = `${plural(predicted, "estudiante evaluado", "estudiantes evaluados")}.`
  const moved =
    changed === 0
      ? "Ninguna predicción cambió de categoría."
      : `${plural(changed, "predicción cambió", "predicciones cambiaron")} de categoría.`

  // Said out loud because it explains a roster of thirty showing twenty-two rows. Unexplained,
  // that gap reads as a broken panel rather than as students nobody has finished grading.
  const left =
    skipped === 0
      ? ""
      : ` ${plural(skipped, "quedó", "quedaron")} fuera por no tener las cuatro dimensiones calificadas.`

  return {
    tone: changed === 0 ? "info" : "success",
    message: `${evaluated} ${moved}${left}`,
  }
}
