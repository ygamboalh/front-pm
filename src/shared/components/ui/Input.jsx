import { forwardRef } from 'react';
import { cn } from '@/shared/lib/cn';

const TONES = {
  default: 'text-ink',
  price: 'text-price font-semibold',
  gain: 'text-gain font-semibold',
  percent: 'text-percent font-semibold',
};

const Input = forwardRef(function Input(
  {
    label,
    error,
    hint,
    icon: Icon,
    id,
    className,
    tone = 'default',
    prefix,
    suffix,
    ...props
  },
  ref,
) {
  const inputId = id || props.name;

  return (
    <div className="space-y-1.5">
      {label ? (
        <label htmlFor={inputId} className="block text-sm font-medium text-ink-soft">
          {label}
        </label>
      ) : null}

      <div className="relative">
        {Icon ? (
          <Icon
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
            size={18}
          />
        ) : null}

        {prefix ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-ink-faint">
            {prefix}
          </span>
        ) : null}

        <input
          id={inputId}
          ref={ref}
          className={cn(
            'w-full rounded-lg border border-line bg-surface-raised px-3 py-2.5 text-sm shadow-sm outline-none transition placeholder:text-ink-faint focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:bg-surface',
            TONES[tone] || TONES.default,
            Icon && 'pl-10',
            prefix && 'pl-7',
            suffix && 'pr-12',
            error && 'border-danger/60 focus:border-danger focus:ring-danger/20',
            className,
          )}
          aria-invalid={Boolean(error)}
          {...props}
        />

        {suffix ? (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-ink-faint">
            {suffix}
          </span>
        ) : null}
      </div>

      {error ? (
        <p className="text-xs font-medium text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
});

export default Input;
