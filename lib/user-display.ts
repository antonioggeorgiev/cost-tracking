export function getUserInitials(name: string | null | undefined, fallback = "?") {
  if (!name) {
    return fallback;
  }

  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
