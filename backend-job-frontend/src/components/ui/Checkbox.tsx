import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
  hint?: ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, hint, className, id, ...props },
  ref,
) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  return (
    <div className="flex items-start gap-3">
      <input
        ref={ref}
        id={fieldId}
        type="checkbox"
        className={cn(
          'mt-0.5 size-5 shrink-0 cursor-pointer rounded border-line-strong text-flame-600 accent-flame-600 focus-visible:outline-flame-600',
          className,
        )}
        {...props}
      />
      <label htmlFor={fieldId} className="cursor-pointer text-sm leading-snug text-ink">
        <span className="font-medium">{label}</span>
        {hint && <span className="block text-muted">{hint}</span>}
      </label>
    </div>
  );
});
