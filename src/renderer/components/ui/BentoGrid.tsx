import React from 'react'
import './design-system.css'

export interface BentoGridProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: 'div' | 'section'
}

export interface BentoItemProps extends React.HTMLAttributes<HTMLDivElement> {
  span?: 'sm' | 'md' | 'lg' | 'full'
}

export function BentoGrid({ as: Component = 'div', className = '', ...props }: BentoGridProps) {
  return <Component className={`bx-d1-bento-grid ${className}`} {...props} />
}

export function BentoItem({ span = 'md', className = '', ...props }: BentoItemProps) {
  return <div className={`bx-d1-bento-item bx-d1-bento-item--${span} ${className}`} {...props} />
}
