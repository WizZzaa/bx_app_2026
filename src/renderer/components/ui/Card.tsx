import React from 'react';

interface Props extends React.HTMLAttributes<HTMLElement> {
  title?: string;
  icon?: React.ReactNode;
  description?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}

export default function Card({ title, icon, description, children, actions, className = '', ...rest }: Props) {
  return (
    <section className={`overflow-hidden rounded-2xl border border-bx-border bg-bx-surface shadow-sm ${className}`} {...rest}>
      {(title || actions) && (
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-bx-border">
          <div>
            {title && (
              <h2 className="text-sm font-semibold text-bx-text flex items-center gap-2">
                {icon && <span className="text-bx-muted" aria-hidden="true">{icon}</span>}
                {title}
              </h2>
            )}
            {description && <p className="text-xs text-bx-muted mt-1">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
        </div>
      )}
      {children && <div className="p-5">{children}</div>}
    </section>
  );
}
