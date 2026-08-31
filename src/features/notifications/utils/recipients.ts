import { isRole, type UserRole } from "@/features/auth/types"
import type { UsersListItem } from "@/features/users/models/response/user-response"
import type { Recipient } from "../types"

/** Who the Director may write to, which is also what the API will accept. */
const MAY_BE_WRITTEN_TO: UserRole[] = ["TEACHER", "SECRETARY"]

/**
 * The staff the Director may write to, out of the whole roster.
 *
 * <p>Matched through {@link isRole} rather than by string, because the role a user carries is
 * whatever the roles table spells — the rest of the app already reads it case-insensitively, and a
 * form that silently offers nobody is worse than one that offers the wrong name.
 *
 * <p>Inactive people are left out here as well as by the API: a notice nobody will ever sign in to
 * read is not a notice.
 */
export function recipientsFrom(staff: UsersListItem[]): Recipient[] {
  return staff
    .filter((u) => u.active && MAY_BE_WRITTEN_TO.some((r) => isRole(u.role, r)))
    .map((u) => ({
      id: u.id,
      fullName: `${u.names} ${u.lastNames}`,
    }))
}
