export type AppRole = "ADMIN" | "USER";

export function normalizeRole(role: unknown): AppRole | null {
  if (typeof role !== "string") return null;

  const normalized = role.trim().toUpperCase();
  if (normalized === "ADMIN" || normalized === "USER") {
    return normalized;
  }

  return null;
}

export function isAdminRole(role: unknown) {
  return normalizeRole(role) === "ADMIN";
}
