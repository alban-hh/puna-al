export const controlBase =
  'w-full rounded-lg border bg-surface px-3.5 text-ink placeholder:text-muted/70 press ' +
  'focus:outline-none focus-visible:outline-none focus:border-flame-500 focus:ring-4 focus:ring-flame-500/10 ' +
  'disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:text-muted';

export function controlBorder(hasError?: boolean): string {
  return hasError ? 'border-flame-400' : 'border-line-strong';
}
