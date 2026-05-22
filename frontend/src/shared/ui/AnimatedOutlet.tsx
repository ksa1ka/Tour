import { AnimatePresence, motion } from 'framer-motion'
import { useLocation, useOutlet } from 'react-router-dom'

import { pageTransition, pageVariants } from '@/shared/lib/motion'

/**
 * Route-level page transitions (pathname key). Keeps motion subtle.
 * useOutlet() — корректная привязка к location; <Outlet /> внутри motion часто даёт пустую страницу до F5.
 */
export function AnimatedOutlet() {
  const location = useLocation()
  const outlet = useOutlet()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={pageTransition}
        className="min-h-0 flex-1"
      >
        {outlet}
      </motion.div>
    </AnimatePresence>
  )
}
