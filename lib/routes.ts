/** Regex to extract workspace slug from a pathname like /workspaces/[slug]/... */
export const WORKSPACE_SLUG_PATTERN = /^\/workspaces\/([^/]+)/;

export const routes = {
  home: "/",
  signIn: "/sign-in",

  workspaces: "/workspaces",
  workspace: (slug: string) => `/workspaces/${slug}`,
  workspaceExpenses: (slug: string) => `/workspaces/${slug}/expenses`,
  workspaceCategories: (slug: string) => `/workspaces/${slug}/categories`,
  workspaceRecurring: (slug: string) => `/workspaces/${slug}/recurring`,
  workspaceDebts: (slug: string) => `/workspaces/${slug}/debts`,
  workspaceMembers: (slug: string) => `/workspaces/${slug}/members`,
  workspaceSettings: (slug: string) => `/workspaces/${slug}/settings`,
  workspaceProfile: (slug: string) => `/workspaces/${slug}/profile`,

  acceptInvite: (token: string) => `/accept-invite/${token}`,
} as const;
