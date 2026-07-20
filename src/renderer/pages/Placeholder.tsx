import React from 'react';
import Icon from '../lib/ui/Icon';

interface Props {
  icon: string;
  title: string;
  description: string;
}

export default function Placeholder({ icon, title, description }: Props) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-bx-surface-2 text-bx-accent"><Icon name={icon} className="h-6 w-6" /></div>
        <h2 className="text-lg font-semibold text-bx-text mb-2">{title}</h2>
        <p className="text-sm text-bx-muted max-w-xs">{description}</p>
        <div className="mt-4 inline-block px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs">В разработке</div>
      </div>
    </div>
  );
}
