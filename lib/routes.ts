/** Regex to extract workspace slug from a pathname like /workspaces/[slug]/... */
export const WORKSPACE_SLUG_PATTERN = /^\/workspaces\/([^/]+)/;

export const routes = {
  home: "/",
  signIn: "/sign-in",

  workspaces: "/workspaces",
  workspace: (slug: string) => `/workspaces/${slug}`,
  workspaceOverview: (slug: string) => `/workspaces/${slug}/overview`,
  workspaceDashboard: (slug: string) => `/workspaces/${slug}/dashboard`,
  workspaceExpenses: (slug: string) => `/workspaces/${slug}/expenses`,
  workspaceExpense: (slug: string, expenseId: string) => `/workspaces/${slug}/expenses/${expenseId}`,
  workspaceCategories: (slug: string) => `/workspaces/${slug}/categories`,
  workspaceRecurring: (slug: string) => `/workspaces/${slug}/recurring`,
  workspaceRecurringTemplate: (slug: string, templateId: string) => `/workspaces/${slug}/recurring/${templateId}`,
  workspaceDebts: (slug: string) => `/workspaces/${slug}/debts`,
  workspaceDebt: (slug: string, debtAccountId: string) => `/workspaces/${slug}/debts/${debtAccountId}`,
  workspaceMembers: (slug: string) => `/workspaces/${slug}/members`,
  workspaceSettings: (slug: string) => `/workspaces/${slug}/settings`,
  workspaceProfile: (slug: string) => `/workspaces/${slug}/profile`,

  acceptInvite: (token: string) => `/accept-invite/${token}`,
} as const;
