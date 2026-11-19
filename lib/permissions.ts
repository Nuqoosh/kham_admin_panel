import type { AuthUser } from "@/lib/api";

/** Collect permission names from /auth/me payload. */
export function collectPermissions(user: AuthUser | null | undefined): Set<string> {
  const set = new Set<string>();
  if (!user) return set;

  for (const role of user.roles ?? []) {
    for (const perm of role.permissions ?? []) {
      if (perm?.name) set.add(perm.name);
    }
  }

  const top = user.permissions;
  if (Array.isArray(top)) {
    for (const perm of top) {
      if (typeof perm === "string") set.add(perm);
      else if (perm && typeof perm === "object" && "name" in perm) {
        const name = (perm as { name?: unknown }).name;
        if (typeof name === "string") set.add(name);
      }
    }
  }

  return set;
}

/**
 * True if the user has any of the listed permissions.
 * If the API returned no permissions at all, allow (avoid locking out admins
 * until /auth/me always includes the matrix).
 */
export function can(
  user: AuthUser | null | undefined,
  ...needed: string[]
): boolean {
  if (!needed.length) return true;
  const set = collectPermissions(user);
  if (set.size === 0) return true;
  return needed.some((p) => set.has(p));
}
