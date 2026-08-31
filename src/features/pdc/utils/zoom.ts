/**
 * The sizes the preview offers. The sheet is a Letter page on its side — eleven inches, wider than
 * the panel it sits in — so it starts reduced and the teacher opens it up to read a cell closely.
 */
export const ZOOM_STEPS = [0.5, 0.6, 0.75, 1] as const

export const DEFAULT_ZOOM = 0.6

/** The step nearest to a size, so a value from anywhere else lands on the scale rather than off it. */
function nearestStep(zoom: number): number {
  return ZOOM_STEPS.reduce((closest, step) =>
    Math.abs(step - zoom) < Math.abs(closest - zoom) ? step : closest
  )
}

export function zoomIn(zoom: number): number {
  const index = ZOOM_STEPS.indexOf(
    nearestStep(zoom) as (typeof ZOOM_STEPS)[number]
  )
  return ZOOM_STEPS[Math.min(index + 1, ZOOM_STEPS.length - 1)]
}

export function zoomOut(zoom: number): number {
  const index = ZOOM_STEPS.indexOf(
    nearestStep(zoom) as (typeof ZOOM_STEPS)[number]
  )
  return ZOOM_STEPS[Math.max(index - 1, 0)]
}
