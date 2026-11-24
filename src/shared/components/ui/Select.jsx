import { forwardRef } from 'react';
import { TbChevronDown } from 'react-icons/tb';
import { cn } from '@/shared/lib/cn';

const Select = forwardRef(function Select(
  { label, error, hint, options = [], placeholder, id, className, children, ...props },
  ref,
) {
  const selectId = id || props.name;

  return (
    <div className="space-y-1.5">
      {label ? (
        <label htmlFor={selectId} className="block text-sm font-medium text-ink-soft">
          {label}
        </label>
      ) : null}

      <div className="relative">
        <select
          id={selectId}
          ref={ref}
          className={cn(
            'h-[42px] w-full appearance-none rounded-lg border border-line bg-surface-raised pl-3 pr-10 text-sm text-ink shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:bg-surface',
            error && 'border-danger/60 focus:border-danger focus:ring-danger/20',
            className,
          )}
          aria-invalid={Boolean(error)}
          {...props}
        >
          {placeholder ? <option value="">{placeholder}</option> : null}
          {options.length > 0
            ? options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))
            : children}
        </select>

        <TbChevronDown
          aria-hidden="true"
          size={18}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint"
        />
      </div>

      {error ? (
        <p className="text-xs font-medium text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
});

export default Select;
