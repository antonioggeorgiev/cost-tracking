export function parseAdminListSearchParams(params: { search?: string; page?: string }) {
  return {
    search: params.search ?? "",
    page: Number(params.page) || 1,
  };
}

export function createAdminListPageHref(pathname: string, options: { search: string; page: number }) {
  return {
    pathname,
    query: {
      search: options.search || undefined,
      page: options.page,
    },
  };
}
