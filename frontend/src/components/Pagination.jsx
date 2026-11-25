import { ChevronLeft, ChevronRight } from "lucide-react";

import "../styles/pagination.css";

function getPageItems(page, pages) {
  if (pages <= 7) {
    return Array.from({ length: pages }, (_, index) => index + 1);
  }

  const items = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pages - 1, page + 1);

  if (start > 2) items.push("gap-start");
  for (let current = start; current <= end; current += 1) items.push(current);
  if (end < pages - 1) items.push("gap-end");

  items.push(pages);
  return items;
}

/*
 * Props:
 * - page, pages: current page and total pages (1-based)
 * - total (optional): total number of listings, shown in the summary
 * - onPageChange(page): called with the new page number
 * - disabled (optional): disables the controls while a page is loading
 */
function Pagination({ page = 1, pages = 1, total, onPageChange, disabled = false }) {
  if (!pages || pages <= 1) return null;

  function go(target) {
    if (disabled || target < 1 || target > pages || target === page) return;
    onPageChange?.(target);
  }

  return (
    <nav className="pg" aria-label="Pagination">
      <p className="pg-summary" aria-live="polite">
        Page {page} of {pages}
        {Number.isFinite(total) ? ` · ${total} listings` : ""}
      </p>

      <ul className="pg-list">
        <li>
          <button
            className="pg-btn pg-prev"
            type="button"
            disabled={disabled || page <= 1}
            onClick={() => go(page - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft size={16} aria-hidden="true" />
            <span>Previous</span>
          </button>
        </li>

        {getPageItems(page, pages).map((item) =>
          typeof item === "number" ? (
            <li key={item}>
              <button
                className={`pg-btn pg-num${item === page ? " is-current" : ""}`}
                type="button"
                disabled={disabled}
                aria-label={`Page ${item}`}
                aria-current={item === page ? "page" : undefined}
                onClick={() => go(item)}
              >
                {item}
              </button>
            </li>
          ) : (
            <li key={item} className="pg-gap" aria-hidden="true">
              …
            </li>
          )
        )}

        <li>
          <button
            className="pg-btn pg-next"
            type="button"
            disabled={disabled || page >= pages}
            onClick={() => go(page + 1)}
            aria-label="Next page"
          >
            <span>Next</span>
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </li>
      </ul>
    </nav>
  );
}

export default Pagination;
