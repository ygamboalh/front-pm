import { cn } from '@/shared/lib/cn';
import Spinner from './Spinner';

const VARIANTS = {
  primary:
    'bg-brand-600 text-white shadow-sm hover:bg-brand-500 focus-visible:ring-brand-500/25',
  secondary:
    'border border-line bg-surface-raised text-ink-soft shadow-sm hover:bg-surface-hover hover:text-ink focus-visible:ring-brand-500/20',
  ghost:
    'text-ink-muted hover:bg-surface-hover hover:text-ink focus-visible:ring-brand-500/20',
  danger:
    'bg-rose-600 text-white shadow-sm hover:bg-rose-500 focus-visible:ring-rose-500/25',
  warning:
    'bg-price text-canvas-deep shadow-sm hover:bg-price/90 focus-visible:ring-price/25',
};

const SIZES = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
};

export default function Button({
  type = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition focus:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Spinner size="sm" /> : null}
      {children}
    </button>
  );
}
