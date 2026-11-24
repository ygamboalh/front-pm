import { cn } from '@/shared/lib/cn';

export function Skeleton({ className }) {
  return (
    <span
      aria-hidden="true"
      className={cn('block animate-pulse rounded-md bg-line/70', className)}
    />
  );
}

export function SkeletonText({ lines = 3, className }) {
  return (
    <span className={cn('block space-y-2', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={`skeleton-line-${index}`}
          className={cn('h-3', index === lines - 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </span>
  );
}
