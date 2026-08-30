/**
 * Blank optional fields are dropped so the API stores an absent value, not an empty string.
 *
 * <p>It sits here rather than inside a feature because two of them send optional prose and need
 * the same rule: the plan's heading and subject steps, and the adaptations step. Kept under `pdc`
 * it made `adaptation` import from `pdc` while `pdc` imports the adaptations step back — a circle
 * that leaves neither feature movable on its own.
 */
export function trimmed(value: string): string | undefined {
  const v = value.trim()
  return v === "" ? undefined : v
}
