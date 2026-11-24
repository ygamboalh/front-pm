import Card from './Card';
import { cn } from '@/shared/lib/cn';
import { METRIC_TONES } from '@/shared/lib/metricTones';

export default function Metric({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'neutral',
  footer,
  className,
}) {
  const styles = METRIC_TONES[tone] || METRIC_TONES.neutral;

  return (
    <Card className={cn('p-5', className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</p>
        {Icon ? (
          <span
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-inset',
              styles.icon,
              styles.accent,
            )}
          >
            <Icon size={18} aria-hidden="true" />
          </span>
        ) : null}
      </div>
      <p className={cn('mt-2 text-2xl font-semibold tabular-nums', styles.value)}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-ink-muted">{hint}</p> : null}
      {footer ? <div className="mt-3">{footer}</div> : null}
    </Card>
  );
}
