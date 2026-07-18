import { describe, expect, it } from 'vitest'
import { constrainTrayPosition } from './trayWindowPosition'

const displayBounds = { x: 0, y: 0, width: 1920, height: 1080 }
const workArea = { x: 0, y: 0, width: 1920, height: 1040 }

describe('tray window position', () => {
  it('keeps an automatically docked mascot above the taskbar', () => {
    expect(constrainTrayPosition(1490, 600, 430, 560, workArea)).toEqual({
      x: 1490,
      y: 480,
    })
  })

  it('allows a user-positioned mascot to overlap the taskbar', () => {
    expect(constrainTrayPosition(1490, 520, 430, 560, displayBounds)).toEqual({
      x: 1490,
      y: 520,
    })
  })

  it('still prevents a manually positioned mascot from leaving the display', () => {
    expect(constrainTrayPosition(1800, 1000, 430, 560, displayBounds)).toEqual({
      x: 1490,
      y: 520,
    })
  })
})

