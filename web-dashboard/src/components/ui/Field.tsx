import React, { useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

const controlStyles =
  'w-full rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink placeholder:text-ink-4 ' +
  'transition-colors focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink ' +
  'disabled:bg-sunken disabled:text-ink-3 disabled:cursor-not-allowed';

interface FieldWrapperProps {
  label?: string;
  hint?: string;
  error?: string;
  id: string;
  children: React.ReactNode;
}

const FieldWrapper: React.FC<FieldWrapperProps> = ({ label, hint, error, id, children }) => (
  <div className="w-full">
    {label && (
      <label htmlFor={id} className="block text-[13px] font-medium text-ink mb-1.5">
        {label}
      </label>
    )}
    {children}
    {error ? (
      <p className="text-xs text-critical mt-1.5">{error}</p>
    ) : hint ? (
      <p className="text-xs text-ink-3 mt-1.5">{hint}</p>
    ) : null}
  </div>
);

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leading?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, leading, className, id, ...props }, ref) => {
    const autoId = useId();
    const inputId = id || autoId;
    return (
      <FieldWrapper label={label} hint={hint} error={error} id={inputId}>
        <div className="relative">
          {leading && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4 pointer-events-none">{leading}</span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(controlStyles, 'h-10', leading && 'pl-9', error && 'border-critical', className)}
            aria-invalid={!!error}
            {...props}
          />
        </div>
      </FieldWrapper>
    );
  }
);
Input.displayName = 'Input';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, className, id, children, ...props }, ref) => {
    const autoId = useId();
    const selectId = id || autoId;
    return (
      <FieldWrapper label={label} hint={hint} id={selectId}>
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(controlStyles, 'h-10 appearance-none pr-9 cursor-pointer', className)}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" />
        </div>
      </FieldWrapper>
    );
  }
);
Select.displayName = 'Select';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, className, id, ...props }, ref) => {
    const autoId = useId();
    const textareaId = id || autoId;
    return (
      <FieldWrapper label={label} hint={hint} id={textareaId}>
        <textarea ref={ref} id={textareaId} className={cn(controlStyles, 'py-2.5 min-h-[88px]', className)} {...props} />
      </FieldWrapper>
    );
  }
);
Textarea.displayName = 'Textarea';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export const Switch: React.FC<SwitchProps> = ({ checked, onChange, label, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={cn(
      'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-150',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      checked ? 'bg-ink' : 'bg-line-strong'
    )}
  >
    <span
      className={cn(
        'inline-block h-4 w-4 rounded-full bg-white transition-transform duration-150',
        checked ? 'translate-x-[18px]' : 'translate-x-0.5'
      )}
    />
  </button>
);
