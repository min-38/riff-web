import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, fullWidth = false, className = '', ...props }, ref) => {
    return (
      <div className={`${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label className="block text-sm font-medium text-foreground mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-4 py-2
            border ${error ? 'border-error' : 'border-neutral-300 dark:border-neutral-700'}
            rounded-lg
            bg-white dark:bg-neutral-950 text-foreground
            placeholder:text-neutral-400 dark:placeholder:text-neutral-600
            focus:outline-none focus:ring-2
            ${error ? 'focus:ring-error' : 'focus:ring-primary-500'}
            focus:border-transparent
            disabled:bg-neutral-100 dark:disabled:bg-neutral-900 disabled:cursor-not-allowed
            transition-all
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-error">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-neutral-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
