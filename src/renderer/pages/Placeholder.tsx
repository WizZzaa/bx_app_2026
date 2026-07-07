import React from 'react';

interface Props {
  icon: string;
  title: string;
  description: string;
}

export default function Placeholder({ icon, title, description }: Props) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4">{icon}</div>
        <h2 className="text-lg font-semibold text-bx-text mb-2">{title}</h2>
        <p className="text-sm text-bx-muted max-w-xs">{description}</p>
        <div className="mt-4 inline-block px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs">В разработке</div>
      </div>
    </div>
  );
}
