import React from 'react'
import './design-system.css'

export interface SkeletonProps extends React.HTMLAttributes<HTMLSpanElement> {
  width?: string | number
  height?: string | number
}

export function Skeleton({ width, height, style, className = '', ...props }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={`bx-d1-skeleton ${className}`}
      style={{ width, height, ...style }}
      {...props}
    />
  )
}

export interface SkeletonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string
}

export function SkeletonGroup({ label = 'Загрузка данных', children, ...props }: SkeletonGroupProps) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" {...props}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  )
}
