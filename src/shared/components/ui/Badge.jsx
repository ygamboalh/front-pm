import { cn } from '@/shared/lib/cn';

const VARIANTS = {
  neutral: 'bg-surface-hover text-ink-soft ring-line',
  success: 'bg-gain/10 text-gain ring-gain/25',
  warning: 'bg-price/10 text-price ring-price/25',
  danger: 'bg-danger/10 text-danger ring-danger/25',
  brand: 'bg-brand-500/10 text-brand-300 ring-brand-500/30',
  percent: 'bg-percent/10 text-percent ring-percent/25',
  price: 'bg-price/10 text-price ring-price/25',
};

export default function Badge({ variant = 'neutral', className, children, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        VARIANTS[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
