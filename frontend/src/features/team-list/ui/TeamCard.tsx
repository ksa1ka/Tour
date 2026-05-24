import { motion } from 'framer-motion'
import { Pencil, Shield, Trash2, Trophy } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import type { Team } from '@/entities/team/model/types'
import { TeamRosterSection } from '@/features/team-roster/ui/TeamRosterSection'
import { transition } from '@/shared/lib/motion'
import { cn } from '@/shared/lib/utils'
import { SafeImage } from '@/shared/ui/SafeImage'

type TeamCardProps = {
  team: Team
  isAdmin?: boolean
  onEdit?: (team: Team) => void
  onDelete?: (team: Team) => void
  className?: string
}

export function TeamCard({ team, isAdmin, onEdit, onDelete, className }: TeamCardProps) {
  const [logoFailed, setLogoFailed] = useState(false)
  const showLogo = team.logo && !logoFailed
  const [rosterOpen, setRosterOpen] = useState(false)
  const showRosterBlock = (team.players?.length ?? 0) > 0

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ layout: transition.layout, opacity: transition.fast, y: transition.fast }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.997 }}
    >
      <Card
        className={cn(
          'glass-panel group h-full border-primary/10 transition-all duration-300 hover:border-primary/25 hover:shadow-glow',
          className,
        )}
      >
        <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-primary/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <CardHeader className="flex flex-row items-start gap-3 space-y-0 sm:gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/90 bg-muted/35 shadow-inner-glow sm:h-14 sm:w-14">
            {showLogo ? (
              <img
                src={team.logo!}
                alt=""
                className="h-full w-full object-cover"
                onError={() => setLogoFailed(true)}
              />
            ) : (
              <Shield className="h-7 w-7 text-primary/80" aria-hidden />
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="text-base font-bold leading-tight sm:text-lg">{team.name}</CardTitle>
            <div className="text-sm text-muted-foreground">
              <Link
                to={`/tournaments/${team.tournament.id}`}
                className="inline-flex max-w-full items-center gap-2 font-medium text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline"
              >
                <span className="relative h-6 w-6 shrink-0 overflow-hidden rounded-md border border-border/90 bg-muted/30">
                  <SafeImage
                    src={team.tournament.avatarUrl}
                    alt=""
                    fallback={<Trophy className="m-auto h-3 w-3 text-primary/50" aria-hidden />}
                    className="h-full w-full"
                  />
                </span>
                <span className="min-w-0 truncate">{team.tournament.title}</span>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">Обновлено {new Date(team.updatedAt).toLocaleString()}</CardContent>

        {showRosterBlock ? (
          <CardContent className="pt-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full justify-between rounded-xl"
              onClick={() => setRosterOpen((v) => !v)}
            >
              <span className="font-semibold">Состав</span>
              <span className="text-muted-foreground">{rosterOpen ? 'Скрыть' : 'Показать'}</span>
            </Button>
            {rosterOpen ? <TeamRosterSection teamName={team.name} players={team.players ?? []} /> : null}
          </CardContent>
        ) : null}
        {isAdmin && (onEdit || onDelete) ? (
          <CardFooter className="flex flex-col gap-2 border-t border-border/80 pt-3 sm:flex-row sm:flex-wrap sm:pt-4">
            {onEdit ? (
              <Button type="button" variant="outline" size="sm" className="w-full gap-1.5 sm:w-auto" onClick={() => onEdit(team)}>
                <Pencil className="h-3.5 w-3.5" aria-hidden />
                Изменить
              </Button>
            ) : null}
            {onDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive sm:w-auto"
                onClick={() => onDelete(team)}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                Удалить
              </Button>
            ) : null}
          </CardFooter>
        ) : null}
      </Card>
    </motion.div>
  )
}
