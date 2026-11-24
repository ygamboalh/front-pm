import { cn } from '@/shared/lib/cn';
import { TbInbox } from 'react-icons/tb';

export function Table({ className, children }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn('min-w-full border-collapse text-left text-sm', className)}>
        {children}
      </table>
    </div>
  );
}

export function TableHead({ className, children }) {
  return (
    <thead
      className={cn(
        'bg-surface-raised text-[11px] uppercase tracking-wide text-ink-muted',
        className,
      )}
    >
      {children}
    </thead>
  );
}

export function TableBody({ className, children }) {
  return <tbody className={cn('divide-y divide-line', className)}>{children}</tbody>;
}

export function TableRow({ className, children, ...props }) {
  return (
    <tr className={cn('transition-colors hover:bg-surface-hover/70', className)} {...props}>
      {children}
    </tr>
  );
}

const ALIGN = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

export function TableHeaderCell({ align = 'left', className, children, ...props }) {
  return (
    <th
      scope="col"
      className={cn('whitespace-nowrap px-4 py-3 font-semibold', ALIGN[align], className)}
      {...props}
    >
      {children}
    </th>
  );
}

export function TableCell({ align = 'left', className, children, ...props }) {
  return (
    <td className={cn('px-4 py-3 align-middle text-ink-soft', ALIGN[align], className)} {...props}>
      {children}
    </td>
  );
}

export function TableEmpty({
  colSpan,
  icon: Icon = TbInbox,
  title = 'Sin resultados',
  description,
  children,
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-14 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-hover text-ink-faint">
          <Icon size={22} aria-hidden="true" />
        </span>
        <p className="mt-3 text-sm font-medium text-ink">{title}</p>
        {description ? (
          <p className="mx-auto mt-1 max-w-sm text-xs text-ink-muted">{description}</p>
        ) : null}
        {children ? <div className="mt-4">{children}</div> : null}
      </td>
    </tr>
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <TableBody>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <TableRow key={`skeleton-row-${rowIndex}`} className="hover:bg-transparent">
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <TableCell key={`skeleton-cell-${columnIndex}`}>
              <span
                className="block h-3.5 animate-pulse rounded bg-line/70"
                style={{ width: `${55 + ((rowIndex + columnIndex) % 4) * 12}%` }}
                aria-hidden="true"
              />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  );
}
