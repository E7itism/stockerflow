import { cn } from '@/lib/utils';

/**
 * Skeleton — base pulsing placeholder.
 * Used to build layout-matching loading states.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-md bg-slate-100', className)} />
  );
}
