import { TbInbox } from 'react-icons/tb';
import { cn } from '@/shared/lib/cn';

export default function EmptyState({
  icon: Icon = TbInbox,
  title = 'Sin resultados',
  description,
  action,
  className,
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-hover text-ink-faint">
        <Icon size={22} aria-hidden="true" />
      </span>
      <p className="mt-3 text-sm font-medium text-ink">{title}</p>
      {description ? (
        <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-ink-muted">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
