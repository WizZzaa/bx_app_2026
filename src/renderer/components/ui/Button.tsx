import React from 'react';

type Variant = 'primary' | 'danger' | 'secondary' | 'ghost' | 'success';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const styles: Record<Variant, string> = {
  primary: 'border border-transparent bg-bx-accent text-bx-on-accent hover:brightness-95',
  danger: 'border border-transparent bg-red-600 text-white hover:bg-red-700',
  success: 'border border-transparent bg-green-700 text-white hover:bg-green-800',
  secondary: 'border border-bx-border-2 bg-bx-surface-2 text-bx-text hover:bg-bx-bg',
  ghost: 'border border-transparent bg-transparent text-bx-text hover:bg-bx-surface-2',
};

const Button = React.forwardRef<HTMLButtonElement, Props>(function Button({ variant = 'primary', loading, children, disabled, className = '', ...rest }, ref) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-[background-color,color,border-color,filter] duration-[var(--bx-motion-normal)] disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
      {...rest}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" />
      )}
      {loading && <span className="sr-only">Выполняется</span>}
      {children}
    </button>
  );
})

export default Button
