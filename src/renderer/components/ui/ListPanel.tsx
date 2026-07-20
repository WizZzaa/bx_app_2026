import React from 'react'

interface ListPanelProps {
  label: string
  children: React.ReactNode
  className?: string
}

export default function ListPanel({ label, children, className = '' }: ListPanelProps) {
  return <ul aria-label={label} className={`overflow-hidden rounded-2xl border border-bx-border bg-bx-surface ${className}`}>{children}</ul>
}

export function ListPanelItem({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <li className={`border-b border-bx-border px-4 py-3 last:border-0 ${className}`}>{children}</li>
}
