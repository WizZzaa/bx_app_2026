import React from 'react';

interface Props {
  title?: string;
  icon?: string;
  description?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}

export default function Card({ title, icon, description, children, actions }: Props) {
  return (
    <div className="rounded-xl border border-[#1e2535] bg-[#141820] overflow-hidden">
      {(title || actions) && (
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-[#1e2535]">
          <div>
            {title && (
              <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                {icon && <span className="text-base">{icon}</span>}
                {title}
              </h2>
            )}
            {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
        </div>
      )}
      {children && <div className="p-5">{children}</div>}
    </div>
  );
}
