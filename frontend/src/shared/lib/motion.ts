/** Shared easing — short fades, no bouncy overshoot */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const

export const transition = {
  fast: { duration: 0.22, ease: EASE_OUT },
  base: { duration: 0.32, ease: EASE_OUT },
  slow: { duration: 0.42, ease: EASE_OUT },
  spring: { type: 'spring' as const, stiffness: 420, damping: 32 },
  layout: { type: 'spring' as const, stiffness: 380, damping: 34 },
}

export const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
}

export const pageTransition = {
  ...transition.base,
}

export const hoverLift = {
  rest: { y: 0, scale: 1 },
  hover: { y: -2, scale: 1.008 },
  tap: { scale: 0.996 },
}
