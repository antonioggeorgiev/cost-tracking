export type PaginationOptions = {
  page?: number;
  perPage?: number;
};

export function resolvePagination(options?: PaginationOptions, defaults?: { perPage?: number }) {
  const page = options?.page ?? 1;
  const perPage = options?.perPage ?? defaults?.perPage ?? 20;

  return {
    page,
    perPage,
    skip: (page - 1) * perPage,
  };
}

export function createPaginatedResult<T>(items: T[], total: number, pagination: { page: number; perPage: number }) {
  return {
    items,
    total,
    page: pagination.page,
    perPage: pagination.perPage,
    totalPages: Math.ceil(total / pagination.perPage),
  };
}
