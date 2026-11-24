import { TbChevronLeft, TbChevronRight } from 'react-icons/tb';
import { cn } from '@/shared/lib/cn';

function getPageItems(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const items = [1];

  if (current > 4) items.push('ellipsis-start');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let page = start; page <= end; page += 1) {
    items.push(page);
  }

  if (current < total - 3) items.push('ellipsis-end');

  items.push(total);

  return items;
}

export default function Pagination({
  page = 1,
  pageCount = 1,
  onChange,
  total,
  pageSize,
  itemLabel = 'registros',
  className,
}) {
  const safePage = Math.min(Math.max(page, 1), Math.max(pageCount, 1));
  const pages = getPageItems(safePage, Math.max(pageCount, 1));
  const canGoBack = safePage > 1;
  const canGoForward = safePage < pageCount;

  const summary =
    typeof total === 'number' && total > 0
      ? (() => {
          const size = pageSize || total;
          const from = (safePage - 1) * size + 1;
          const to = Math.min(safePage * size, total);
          return `${from}–${to} de ${total} ${itemLabel}`;
        })()
      : null;

  const goTo = (target) => {
    if (!onChange) return;
    const next = Math.min(Math.max(target, 1), Math.max(pageCount, 1));
    if (next !== safePage) onChange(next);
  };

  return (
    <nav
      aria-label="Paginación"
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3',
        className,
      )}
    >
      <p className="text-xs text-ink-muted">
        {summary || `Página ${safePage} de ${Math.max(pageCount, 1)}`}
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => goTo(safePage - 1)}
          disabled={!canGoBack}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-line text-ink-muted transition hover:bg-surface-hover hover:text-ink-soft disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Página anterior"
        >
          <TbChevronLeft size={17} />
        </button>

        {pages.map((item) =>
          typeof item === 'number' ? (
            <button
              key={item}
              type="button"
              onClick={() => goTo(item)}
              aria-current={item === safePage ? 'page' : undefined}
              className={cn(
                'inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-xs font-medium transition',
                item === safePage
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-ink-soft hover:bg-surface-hover hover:text-ink',
              )}
            >
              {item}
            </button>
          ) : (
            <span key={item} className="px-1 text-xs text-ink-faint" aria-hidden="true">
              …
            </span>
          ),
        )}

        <button
          type="button"
          onClick={() => goTo(safePage + 1)}
          disabled={!canGoForward}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-line text-ink-muted transition hover:bg-surface-hover hover:text-ink-soft disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Página siguiente"
        >
          <TbChevronRight size={17} />
        </button>
      </div>
    </nav>
  );
}
