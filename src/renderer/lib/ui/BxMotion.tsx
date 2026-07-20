import React, { useEffect, useImperativeHandle, useMemo, useState } from 'react'
// eslint-disable-next-line import/no-unresolved -- Motion 12 exposes this bundle-safe subpath via package exports.
import { useAnimate } from 'motion/react-mini'
import {
  BX_MOTION_EASING,
  BX_REDUCED_MOTION_QUERY,
  resolveBxMotionPreset,
  type BxMotionPhase,
  type BxMotionPresetName,
} from '../../../shared/design/motion'

export interface BxMotionProps extends React.HTMLAttributes<HTMLDivElement> {
  preset?: BxMotionPresetName
  phase?: 'enter' | 'exit'
}

const readReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia(BX_REDUCED_MOTION_QUERY).matches

export const useBxReducedMotion = (): boolean => {
  const [reduced, setReduced] = useState(readReducedMotion)

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const query = window.matchMedia(BX_REDUCED_MOTION_QUERY)
    const update = () => setReduced(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return reduced
}

const durationSeconds = (motionPhase: BxMotionPhase): number => {
  const { transition } = motionPhase
  return (transition.type === 'spring' ? transition.settleMs : transition.durationMs) / 1000
}

export const BxMotion = React.forwardRef<HTMLDivElement, BxMotionProps>(function BxMotion(
  { preset = 'fade', phase = 'enter', style, children, ...rest },
  forwardedRef,
) {
  const [scope, animate] = useAnimate<HTMLDivElement>()
  const reduced = useBxReducedMotion()
  const motionPhase = resolveBxMotionPreset(preset, reduced)[phase]
  useImperativeHandle(forwardedRef, () => scope.current, [scope])
  const initialStyle = useMemo<React.CSSProperties>(() => ({
    opacity: motionPhase.from.opacity,
    transform: motionPhase.from.transform,
    willChange: reduced ? undefined : 'opacity, transform',
    ...style,
  }), [motionPhase, reduced, style])

  useEffect(() => {
    const element = scope.current
    if (!element) return

    if (typeof element.animate !== 'function') {
      element.style.opacity = String(motionPhase.to.opacity)
      element.style.transform = motionPhase.to.transform
      element.style.willChange = ''
      return
    }

    const controls = animate(
      element,
      {
        opacity: motionPhase.to.opacity,
        transform: motionPhase.to.transform,
      },
      {
        duration: durationSeconds(motionPhase),
        ease: motionPhase.transition.type === 'tween'
          ? motionPhase.transition.easing
          : BX_MOTION_EASING.enter,
      },
    )

    void controls.then(() => {
      element.style.willChange = ''
    })
    return () => controls.stop()
  }, [animate, motionPhase, scope])

  return (
    <div ref={scope} style={initialStyle} {...rest}>
      {children}
    </div>
  )
})

export default BxMotion
