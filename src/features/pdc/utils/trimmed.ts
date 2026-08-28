/**
 * Blank optional fields are dropped so the API stores an absent value, not an empty string. The
 * heading step and the subject step both send optional prose, and both need the same rule.
 */
export function trimmed(value: string): string | undefined {
  const v = value.trim()
  return v === "" ? undefined : v
}
