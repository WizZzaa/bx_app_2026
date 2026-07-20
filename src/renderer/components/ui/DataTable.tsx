import React from 'react'

interface DataTableProps {
  label: string
  children: React.ReactNode
  className?: string
}

export default function DataTable({ label, children, className = '' }: DataTableProps) {
  return (
    <div className={`max-w-full overflow-x-auto rounded-2xl border border-bx-border bg-bx-surface ${className}`} role="region" aria-label={label} tabIndex={0}>
      <table className="w-full border-collapse text-left text-sm [font-variant-numeric:tabular-nums]">
        {children}
      </table>
    </div>
  )
}
