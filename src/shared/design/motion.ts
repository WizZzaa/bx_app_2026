export const BX_REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)' as const

export const BX_ANIMATED_PROPERTIES = ['opacity', 'transform'] as const
export type BxAnimatedProperty = typeof BX_ANIMATED_PROPERTIES[number]

export interface BxMotionFrame {
  readonly opacity: number
  readonly transform: string
}

export interface BxTweenTransition {
  readonly type: 'tween'
  readonly durationMs: number
  readonly easing: readonly [number, number, number, number]
}

export interface BxSpringTransition {
  readonly type: 'spring'
  readonly stiffness: number
  readonly damping: number
  readonly mass: number
  /** Expected visual settling budget, used by adapters and performance tests. */
  readonly settleMs: number
}

export type BxMotionTransition = BxTweenTransition | BxSpringTransition

export interface BxMotionPhase {
  readonly from: BxMotionFrame
  readonly to: BxMotionFrame
  readonly transition: BxMotionTransition
}

export interface BxMotionPreset {
  readonly enter: BxMotionPhase
  readonly exit: BxMotionPhase
}

export const BX_MOTION_EASING = {
  enter: [0.22, 1, 0.36, 1],
  exit: [0.4, 0, 1, 1],
} as const

const frame = (opacity: number, transform = 'none'): BxMotionFrame => ({ opacity, transform })

const tween = (
  durationMs: number,
  easing: BxTweenTransition['easing'],
): BxTweenTransition => ({ type: 'tween', durationMs, easing })

export const BX_MOTION_PRESETS = {
  feedback: {
    enter: {
      from: frame(0),
      to: frame(1),
      transition: tween(120, BX_MOTION_EASING.enter),
    },
    exit: {
      from: frame(1),
      to: frame(0),
      transition: tween(80, BX_MOTION_EASING.exit),
    },
  },
  fade: {
    enter: {
      from: frame(0),
      to: frame(1),
      transition: tween(180, BX_MOTION_EASING.enter),
    },
    exit: {
      from: frame(1),
      to: frame(0),
      transition: tween(120, BX_MOTION_EASING.exit),
    },
  },
  raise: {
    enter: {
      from: frame(0, 'translate3d(0, 8px, 0)'),
      to: frame(1),
      transition: tween(220, BX_MOTION_EASING.enter),
    },
    exit: {
      from: frame(1),
      to: frame(0, 'translate3d(0, 4px, 0)'),
      transition: tween(140, BX_MOTION_EASING.exit),
    },
  },
  dialog: {
    enter: {
      from: frame(0, 'scale(0.98)'),
      to: frame(1),
      transition: tween(240, BX_MOTION_EASING.enter),
    },
    exit: {
      from: frame(1),
      to: frame(0, 'scale(0.98)'),
      transition: tween(160, BX_MOTION_EASING.exit),
    },
  },
  popover: {
    enter: {
      from: frame(0, 'translate3d(0, -4px, 0) scale(0.98)'),
      to: frame(1),
      transition: tween(180, BX_MOTION_EASING.enter),
    },
    exit: {
      from: frame(1),
      to: frame(0, 'translate3d(0, -2px, 0) scale(0.98)'),
      transition: tween(110, BX_MOTION_EASING.exit),
    },
  },
  sheet: {
    enter: {
      from: frame(0, 'translate3d(0, 16px, 0)'),
      to: frame(1),
      transition: {
        type: 'spring',
        stiffness: 380,
        damping: 34,
        mass: 0.8,
        settleMs: 320,
      },
    },
    exit: {
      from: frame(1),
      to: frame(0, 'translate3d(0, 12px, 0)'),
      transition: tween(180, BX_MOTION_EASING.exit),
    },
  },
  route: {
    enter: {
      from: frame(0),
      to: frame(1),
      transition: tween(200, BX_MOTION_EASING.enter),
    },
    exit: {
      from: frame(1),
      to: frame(0),
      transition: tween(120, BX_MOTION_EASING.exit),
    },
  },
} as const satisfies Record<string, BxMotionPreset>

export type BxMotionPresetName = keyof typeof BX_MOTION_PRESETS

export const BX_STAGGER = {
  delayMs: 30,
  maxChildren: 6,
} as const

const stillPhase = (): BxMotionPhase => ({
  from: frame(1),
  to: frame(1),
  transition: tween(0, BX_MOTION_EASING.enter),
})

const reducedPreset = (): BxMotionPreset => ({
  enter: stillPhase(),
  exit: stillPhase(),
})

export const BX_REDUCED_MOTION_PRESETS: Readonly<Record<BxMotionPresetName, BxMotionPreset>> = {
  feedback: reducedPreset(),
  fade: reducedPreset(),
  raise: reducedPreset(),
  dialog: reducedPreset(),
  popover: reducedPreset(),
  sheet: reducedPreset(),
  route: reducedPreset(),
}

export const BX_REDUCED_STAGGER = {
  delayMs: 0,
  maxChildren: BX_STAGGER.maxChildren,
} as const

export const resolveBxMotionPreset = (
  name: BxMotionPresetName,
  prefersReducedMotion: boolean,
): BxMotionPreset => prefersReducedMotion
  ? BX_REDUCED_MOTION_PRESETS[name]
  : BX_MOTION_PRESETS[name]
