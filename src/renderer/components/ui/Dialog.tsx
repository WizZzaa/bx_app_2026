import React from 'react'
import { OverlayPanel, type OverlayPanelProps } from './OverlayPanel'

export type DialogProps = Omit<OverlayPanelProps, 'kind'>

export function Dialog({ closeOnPopState = true, ...props }: DialogProps) {
  return <OverlayPanel kind="dialog" closeOnPopState={closeOnPopState} {...props} />
}

export default Dialog
