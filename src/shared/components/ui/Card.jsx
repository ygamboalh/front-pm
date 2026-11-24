import { cn } from '@/shared/lib/cn';

export default function Card({ className, children, ...props }) {
  return (
    <div
      className={cn('min-w-0 rounded-xl border border-line bg-surface shadow-card', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, description, actions, className }) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4',
        className,
      )}
    >
      <div>
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        {description ? <p className="mt-0.5 text-xs text-ink-muted">{description}</p> : null}
      </div>
      {actions}
    </div>
  );
}
