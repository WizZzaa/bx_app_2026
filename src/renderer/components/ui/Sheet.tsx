import React from 'react'
import { OverlayPanel, type OverlayPanelProps } from './OverlayPanel'

export type SheetProps = Omit<OverlayPanelProps, 'kind'>

export function Sheet({ closeOnPopState = true, ...props }: SheetProps) {
  return <OverlayPanel kind="sheet" closeOnPopState={closeOnPopState} {...props} />
}

export default Sheet
