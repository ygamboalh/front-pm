import { TbAlertTriangle } from 'react-icons/tb';
import Button from './Button';
import { getApiErrorMessage } from '@/shared/api/strapiClient';
import { cn } from '@/shared/lib/cn';

export default function ErrorState({
  title = 'No se pudo cargar la información',
  description,
  error,
  onRetry,
  retryLabel = 'Reintentar',
  className,
}) {
  const message = description || (error ? getApiErrorMessage(error) : null);

  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center px-6 py-12 text-center',
        className,
      )}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger">
        <TbAlertTriangle size={22} aria-hidden="true" />
      </span>
      <p className="mt-3 text-sm font-medium text-ink">{title}</p>
      {message ? (
        <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-ink-muted">{message}</p>
      ) : null}
      {onRetry ? (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
