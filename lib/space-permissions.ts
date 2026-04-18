const MANAGEABLE_SPACE_ROLES = new Set(["owner", "editor"]);

export function canManageSpace(role: string | null | undefined) {
  return role != null && MANAGEABLE_SPACE_ROLES.has(role);
}
