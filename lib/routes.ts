export const routes = {
  home: "/",
  signIn: "/sign-in",

  overview: "/overview",
  quickAdd: "/quick-add",
  expenses: "/expenses",
  expense: (expenseId: string) => `/expenses/${expenseId}`,
  recurring: "/recurring",
  recurringTemplate: (templateId: string) => `/recurring/${templateId}`,
  debts: "/debts",
  debt: (debtAccountId: string) => `/debts/${debtAccountId}`,
  categories: "/categories",
  members: "/members",
  settings: "/settings",
  profile: "/profile",
  spaces: "/spaces",

  acceptInvite: (token: string) => `/accept-invite/${token}`,

  // Admin routes
  admin: "/admin",
  adminUsers: "/admin/users",
  adminUser: (userId: string) => `/admin/users/${userId}`,
  adminSpaces: "/admin/spaces",
  adminSpace: (spaceId: string) => `/admin/spaces/${spaceId}`,
  adminCategories: "/admin/categories",
} as const;
