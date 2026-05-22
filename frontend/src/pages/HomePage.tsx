import { motion } from 'framer-motion'
import { Radio, ShieldCheck, Sparkles } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'
import { RealtimeChat } from '@/features/chat/ui/RealtimeChat'
import { EASE_OUT } from '@/shared/lib/motion'
import { BracketFrame } from '@/shared/ui/BracketFrame'

const heroHighlights = [
  {
    label: 'Живые обновления',
    text: 'Счёт и сетка меняются сами, пока вы смотрите страницу турнира.',
    icon: Radio,
  },
  {
    label: 'Понятные роли',
    text: 'Организаторы управляют турниром, зрители и игроки — следят за ходом игры.',
    icon: ShieldCheck,
  },
] as const

const heroVideoOverride = import.meta.env.VITE_HOME_HERO_VIDEO_URL

export function HomePage() {
  const { user } = useAuth()
  const heroVideoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const el = heroVideoRef.current
    if (!el) return

    el.muted = true

    const resume = () => {
      void el.play().catch(() => {})
    }

    const onPause = () => {
      if (!el.ended) resume()
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') resume()
    }

    el.addEventListener('pause', onPause)
    document.addEventListener('visibilitychange', onVisibility)
    resume()

    return () => {
      el.removeEventListener('pause', onPause)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return (
    <div className="relative mx-auto max-w-6xl px-[max(1rem,env(safe-area-inset-left))] py-12 pr-[max(1rem,env(safe-area-inset-right))] sm:px-6 lg:px-8 lg:py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 mx-auto h-[min(42rem,85vh)] max-w-5xl opacity-90"
      >
        <div className="absolute left-[8%] top-8 h-72 w-72 rounded-full bg-white/[0.04] blur-[100px]" />
        <div className="absolute right-[5%] top-24 h-64 w-64 rounded-full bg-white/[0.03] blur-[90px]" />
        <div className="absolute bottom-0 left-1/2 h-48 w-[min(90%,48rem)] -translate-x-1/2 rounded-[100%] bg-white/[0.025] blur-[80px]" />
      </div>
      <div className="grid gap-10 lg:grid-cols-3 lg:items-start">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="relative max-w-3xl space-y-8 lg:col-span-2"
        >
        <div className="inline-flex items-center gap-2 rounded border border-border bg-card/80 px-4 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
          Онлайн · турниры · фэнтези
        </div>
        <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl lg:tracking-tight">
          Смотрите <span className="text-esports-accent">матчи</span>
        </h1>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06, duration: 0.4, ease: EASE_OUT }}
          className="overflow-hidden rounded-xl border border-border/90 bg-black/50 shadow-lg shadow-black/20 ring-1 ring-white/[0.06]"
        >
          <div className="aspect-video w-full max-w-4xl">
            <video
              ref={heroVideoRef}
              className="h-full w-full select-none object-cover"
              muted
              autoPlay
              loop
              playsInline
              preload="auto"
              disablePictureInPicture
              disableRemotePlayback
              tabIndex={-1}
              aria-label="Фоновое демо-видео без звука, зацикленное"
              onContextMenu={(e) => e.preventDefault()}
              onClick={(e) => {
                e.preventDefault()
                void heroVideoRef.current?.play()
              }}
            >
              {heroVideoOverride ? (
                <source src={heroVideoOverride} type="video/mp4" />
              ) : (
                <>
                  <source src="/videos/hero.mp4" type="video/mp4" />
                  <source
                    src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
                    type="video/mp4"
                  />
                </>
              )}
            </video>
          </div>
        </motion.div>
        <div className="flex flex-wrap gap-3">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2, ease: EASE_OUT }}>
            <Button asChild size="lg">
              <Link to="/tournaments">Смотреть турниры</Link>
            </Button>
          </motion.div>
          {!user ? (
            <>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2, ease: EASE_OUT }}>
                <Button asChild size="lg" variant="outline">
                  <Link to="/register">Создать аккаунт</Link>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.99 }} transition={{ duration: 0.2, ease: EASE_OUT }}>
                <Button asChild size="lg" variant="outline">
                  <Link to="/login">Войти</Link>
                </Button>
              </motion.div>
            </>
          ) : null}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.4, ease: EASE_OUT }}
        >
          <BracketFrame className="rounded-xl" accentClassName="border-primary/40">
            <Card className="glass-panel overflow-hidden border-border/90">
              <CardContent className="grid gap-0 divide-y divide-border/60 p-0 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                {heroHighlights.map((item, i) => {
                  const Icon = item.icon
                  return (
                    <motion.div
                      key={item.label}
                      className="relative p-6"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.22 + i * 0.06, duration: 0.32, ease: EASE_OUT }}
                    >
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md border border-border bg-secondary text-primary">
                        <Icon className="h-5 w-5" aria-hidden />
                      </div>
                      <p className="text-sm font-semibold text-foreground">{item.label}</p>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                    </motion.div>
                  )
                })}
              </CardContent>
            </Card>
          </BracketFrame>
        </motion.div>
      </motion.div>

        <aside className="w-full shrink-0 lg:sticky lg:top-24 lg:max-w-md">
          <RealtimeChat
            scope="global"
            title="Общий чат"
            description="Сообщения в реальном времени. Войдите, чтобы отображался ваш логин."
            className="max-h-[calc(100vh-8rem)]"
          />
        </aside>
      </div>
    </div>
  )
}
