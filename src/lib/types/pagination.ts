export interface PagedResponse<T> {
  content: T[]
  page: number
  size: number
  total: number
  totalPages: number
}

export type SortDir = "asc" | "desc"

export interface PageQuery {
  /** 1-indexed page number (backend `offset`). */
  offset: number
  /** items per page (backend `limit`). */
  limit: number
  sort: SortDir
}

export const DEFAULT_PAGE_QUERY: PageQuery = {
  offset: 1,
  limit: 10,
  sort: "asc",
}

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const

/** Build axios params object from a PageQuery (+ extras). */
export const toPageParams = (
  q: PageQuery,
  extra: Record<string, unknown> = {},
): Record<string, unknown> => ({
  offset: q.offset,
  limit: q.limit,
  sort: q.sort,
  ...extra,
})
