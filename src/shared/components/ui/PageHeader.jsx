import { cn } from '@/shared/lib/cn';

export default function PageHeader({ eyebrow, title, description, actions, className }) {
  return (
    <header
      className={cn(
        'flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4',
        className,
      )}
    >
      <div>
        {eyebrow ? (
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{eyebrow}</p>
        ) : null}
        <h1 className="text-xl font-semibold text-ink">{title}</h1>
        {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
