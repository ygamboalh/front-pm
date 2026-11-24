import { forwardRef } from 'react';
import { cn } from '@/shared/lib/cn';

const Textarea = forwardRef(function Textarea(
  { label, error, hint, id, className, rows = 3, ...props },
  ref,
) {
  const textareaId = id || props.name;

  return (
    <div className="space-y-1.5">
      {label ? (
        <label htmlFor={textareaId} className="block text-sm font-medium text-ink-soft">
          {label}
        </label>
      ) : null}

      <textarea
        id={textareaId}
        ref={ref}
        rows={rows}
        className={cn(
          'w-full resize-y rounded-lg border border-line bg-surface-raised px-3 py-2.5 text-sm text-ink shadow-sm outline-none transition placeholder:text-ink-faint focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:bg-surface',
          error && 'border-danger/60 focus:border-danger focus:ring-danger/20',
          className,
        )}
        aria-invalid={Boolean(error)}
        {...props}
      />

      {error ? (
        <p className="text-xs font-medium text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
});

export default Textarea;
