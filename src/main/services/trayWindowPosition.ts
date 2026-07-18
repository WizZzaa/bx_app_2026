export interface ScreenRectangle {
  x: number
  y: number
  width: number
  height: number
}

export interface WindowPosition {
  x: number
  y: number
}

/**
 * Keeps a frameless widget inside the supplied rectangle.
 *
 * Automatic docking passes Electron's workArea so Bix stays above the
 * taskbar. A position chosen by the user passes the full display bounds,
 * allowing the mascot to overlap the taskbar without losing the window.
 */
export const constrainTrayPosition = (
  x: number,
  y: number,
  width: number,
  height: number,
  area: ScreenRectangle,
): WindowPosition => ({
  x: Math.min(area.x + Math.max(0, area.width - width), Math.max(area.x, Math.round(x))),
  y: Math.min(area.y + Math.max(0, area.height - height), Math.max(area.y, Math.round(y))),
})

