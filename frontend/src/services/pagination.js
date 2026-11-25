/*
 * Normalises a listings response so the UI works before and after the
 * backend adds pagination.
 *
 * Accepts:
 * - a plain array                      -> single page
 * - { items | listings | results, page, per_page, total, pages }
 * - { items, pagination: { page, per_page, total, pages } }
 */
export function normalizePage(data) {
  if (Array.isArray(data)) {
    return {
      items: data,
      page: 1,
      perPage: data.length || 1,
      total: data.length,
      pages: 1,
      paginated: false,
    };
  }

  const items = data?.items ?? data?.listings ?? data?.results ?? [];
  const meta = data?.pagination ?? data?.meta ?? data ?? {};

  const page = Number(meta.page) || 1;
  const perPage = Number(meta.per_page ?? meta.perPage) || items.length || 1;
  const total = Number.isFinite(Number(meta.total))
    ? Number(meta.total)
    : items.length;
  const pages =
    Number(meta.pages ?? meta.total_pages) ||
    Math.max(1, Math.ceil(total / perPage));

  return { items, page, perPage, total, pages, paginated: true };
}
