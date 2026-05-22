import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Inbox, Trophy, WifiOff } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchTournaments } from '@/entities/tournament/api/tournamentApi'
import { TOURNAMENT_GAMES, type TournamentGame } from '@/entities/tournament/model/types'
import { transition } from '@/shared/lib/motion'
import { tournamentFormatLabel, tournamentGameLabel, tournamentStatusLabel } from '@/shared/lib/tournamentLabels'
import { EmptyState } from '@/shared/ui/EmptyState'
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner'
import { SafeImage } from '@/shared/ui/SafeImage'

import { TournamentGridSkeleton } from './TournamentGridSkeleton'

const listVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
}

export type TournamentListProps = {
  /** Куда вести с карточки турнира (по умолчанию страница турнира) */
  tournamentHref?: (tournamentId: string) => string
  /** Текст кнопки на карточке */
  actionLabel?: string
  /** Скрыть фильтр по игре и грузить все турниры (например встроенный список без URL) */
  hideGameFilter?: boolean
}

function parseGameParam(raw: string | null): 'all' | TournamentGame {
  if (raw && (TOURNAMENT_GAMES as readonly string[]).includes(raw)) return raw as TournamentGame
  return 'all'
}

export function TournamentList({
  tournamentHref = (id) => `/tournaments/${id}`,
  actionLabel = 'Подробнее',
  hideGameFilter = false,
}: TournamentListProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const gameFilter = hideGameFilter ? 'all' : parseGameParam(searchParams.get('game'))

  const setGameFilter = (next: 'all' | TournamentGame) => {
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev)
        if (next === 'all') p.delete('game')
        else p.set('game', next)
        return p
      },
      { replace: true },
    )
  }

  const { data, isPending, isError, refetch, isRefetching } = useQuery({
    queryKey: ['tournaments', hideGameFilter ? 'all' : gameFilter],
    queryFn: () => fetchTournaments(gameFilter === 'all' ? undefined : { game: gameFilter }),
  })

  if (isPending) {
    return (
      <div className="space-y-6">
        {!hideGameFilter ? <GameFilterBar value={gameFilter} onChange={setGameFilter} /> : null}
        <div className="flex items-center gap-3 rounded-xl border border-border/90 bg-card/50 px-4 py-3 text-sm text-muted-foreground shadow-inner-glow backdrop-blur-sm">
          <LoadingSpinner size="sm" />
          <span className="font-medium">Загрузка турниров…</span>
        </div>
        <TournamentGridSkeleton />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-6">
        {!hideGameFilter ? <GameFilterBar value={gameFilter} onChange={setGameFilter} /> : null}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <EmptyState
            icon={WifiOff}
            title="Не удалось загрузить"
            description="Проверьте интернет-соединение и попробуйте снова. Если проблема повторяется, зайдите позже."
            action={
              <Button
                type="button"
                variant="outline"
                disabled={isRefetching}
                onClick={() => void refetch()}
              >
                {isRefetching ? 'Запрос…' : 'Повторить'}
              </Button>
            }
          />
        </motion.div>
      </div>
    )
  }

  if (!data?.length) {
    const isFiltered = gameFilter !== 'all'
    return (
      <div className="space-y-6">
        {!hideGameFilter ? (
          <GameFilterBar value={gameFilter} onChange={setGameFilter} />
        ) : null}
        <EmptyState
          icon={Inbox}
          title={isFiltered ? 'Нет турниров по этой игре' : 'Пока нет турниров'}
          description={
            isFiltered
              ? 'Смените фильтр или выберите «Все игры», чтобы увидеть остальные турниры.'
              : 'Администратор может создать турнир на странице «Новый турнир» — карточки появятся здесь автоматически.'
          }
          action={
            isFiltered ? (
              <Button type="button" variant="outline" onClick={() => setGameFilter('all')}>
                Все игры
              </Button>
            ) : undefined
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {!hideGameFilter ? <GameFilterBar value={gameFilter} onChange={setGameFilter} /> : null}
      <motion.ul
        className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
        variants={listVariants}
        initial="hidden"
        animate="show"
      >
      {data.map((t) => (
        <motion.li key={t.id} variants={itemVariants} layout transition={transition.layout}>
          <motion.div
            className="h-full"
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.995 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <Card className="glass-panel group h-full overflow-hidden border-primary/10 transition-all duration-300 hover:border-primary/30 hover:shadow-glow">
              <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-primary/45 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative h-32 w-full border-b border-border/80 bg-muted/20">
                <SafeImage
                  src={t.avatarUrl}
                  alt=""
                  fallback={<Trophy className="h-11 w-11 text-primary/30" aria-hidden />}
                  className="h-full w-full"
                />
              </div>
              <CardHeader>
                <CardTitle className="text-lg font-bold tracking-tight">{t.title}</CardTitle>
                <CardDescription className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/90">
                  {tournamentGameLabel(t.game)} · {tournamentStatusLabel(t.status)} · {tournamentFormatLabel(t.format)}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
                <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground sm:line-clamp-2">
                  {t.description ?? 'Без описания'}
                </p>
                <Button asChild variant="neon" size="sm" className="w-full shrink-0 sm:w-auto">
                  <Link to={tournamentHref(t.id)}>{actionLabel}</Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </motion.li>
      ))}
      </motion.ul>
    </div>
  )
}

function GameFilterBar({
  value,
  onChange,
}: {
  value: 'all' | TournamentGame
  onChange: (next: 'all' | TournamentGame) => void
}) {
  const btn = (active: boolean) =>
    active
      ? 'border-primary/50 bg-primary/15 text-foreground shadow-inner-glow'
      : 'border-border/80 bg-card/40 text-muted-foreground hover:border-primary/25 hover:text-foreground'

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Показать турниры: <span className="sr-only">выбор дисциплины</span>
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={btn(value === 'all')}
          onClick={() => onChange('all')}
        >
          Все игры
        </Button>
        {TOURNAMENT_GAMES.map((g) => (
          <Button
            key={g}
            type="button"
            size="sm"
            variant="outline"
            className={btn(value === g)}
            onClick={() => onChange(g)}
          >
            {tournamentGameLabel(g)}
          </Button>
        ))}
      </div>
    </div>
  )
}
