import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EASE_OUT, transition } from '@/shared/lib/motion'
import { BracketFrame } from '@/shared/ui/BracketFrame'

type AuthFormLayoutProps = {
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthFormLayout({ title, description, children, footer }: AuthFormLayoutProps) {
  return (
    <div className="relative mx-auto flex max-w-md flex-col gap-6 px-4 py-12 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ ...transition.base }}>
        <BracketFrame className="rounded-lg shadow-lg" accentClassName="border-primary/30">
          <Card className="glass-panel shadow-lg">
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>{children}</CardContent>
          </Card>
        </BracketFrame>
      </motion.div>
      {footer ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.32, ease: EASE_OUT }}
        >
          {footer}
        </motion.div>
      ) : null}
    </div>
  )
}
