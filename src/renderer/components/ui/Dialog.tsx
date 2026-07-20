import React from 'react'
import { OverlayPanel, type OverlayPanelProps } from './OverlayPanel'

export type DialogProps = Omit<OverlayPanelProps, 'kind'>

export function Dialog(props: DialogProps) {
  return <OverlayPanel kind="dialog" {...props} />
}

export default Dialog
