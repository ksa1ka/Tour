import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/shared/lib/utils'
import type { FantasyShopRewardDto } from '@/shared/api/services/fantasyShopService'

type RewardCardProps = {
  reward: FantasyShopRewardDto
  balance: number
  /** Гость: кнопка ведёт к входу вместо покупки */
  guest?: boolean
  onPurchase: (reward: FantasyShopRewardDto) => void
  index?: number
}

export function RewardCard({ reward, balance, guest = false, onPurchase, index = 0 }: RewardCardProps) {
  const affordable = !guest && balance >= reward.price

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border border-border/80 bg-card/80 shadow-lg shadow-primary/5 ring-1 ring-primary/10 backdrop-blur-sm',
        guest ? 'opacity-100' : affordable ? '' : 'opacity-90',
      )}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted/40">
        <div className="absolute inset-0 bg-card/70 opacity-90" />
        <img
          src={reward.image}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute left-3 top-3 flex gap-2">
          <Badge variant="secondary" className="border border-primary/25 bg-background/70 font-mono text-xs tabular-nums text-primary">
            {reward.price} очков
          </Badge>
        </div>
      </div>

      <div className="relative flex flex-1 flex-col gap-2 p-4 pt-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold leading-snug tracking-tight">{reward.title}</h3>
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary/70" aria-hidden />
        </div>
        <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">{reward.description}</p>
        <Button
          type="button"
          className="mt-1 w-full gap-2 font-semibold"
          disabled={!guest && !affordable}
          asChild={guest}
          onClick={guest ? undefined : () => onPurchase(reward)}
        >
          {guest ? (
            <Link to="/login" state={{ from: '/fantasy-shop' }}>
              Войти для покупки
            </Link>
          ) : affordable ? (
            'Купить'
          ) : (
            'Недостаточно очков'
          )}
        </Button>
      </div>
    </motion.article>
  )
}
