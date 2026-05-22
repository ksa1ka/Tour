import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Coins, Package } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'
import { PurchaseRewardDialog } from '@/features/fantasy-shop/ui/PurchaseRewardDialog'
import { RewardCard } from '@/features/fantasy-shop/ui/RewardCard'
import { fantasyShopService, type FantasyShopRewardDto } from '@/shared/api/services/fantasyShopService'
import { getRestErrorMessage } from '@/shared/lib/restErrors'
import { PageContainer } from '@/shared/ui/PageContainer'
import { PageLoader } from '@/shared/ui/PageLoader'
import { toast } from 'sonner'

const shopQueryKey = ['fantasy-shop', 'me'] as const
const rewardsQueryKey = ['fantasy-shop', 'rewards'] as const

export function FantasyShopPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [confirmReward, setConfirmReward] = useState<FantasyShopRewardDto | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const rewardsQuery = useQuery({
    queryKey: rewardsQueryKey,
    queryFn: () => fantasyShopService.listRewards(),
  })

  const meQuery = useQuery({
    queryKey: shopQueryKey,
    queryFn: () => fantasyShopService.getMe(),
    enabled: Boolean(user),
  })

  const balance = user ? (meQuery.data?.fantasyPointsBalance ?? 0) : 0
  const inventory = user ? (meQuery.data?.inventory ?? []) : []

  const inventoryTotal = useMemo(() => inventory.reduce((acc, row) => acc + row.quantity, 0), [inventory])

  const purchaseMutation = useMutation({
    mutationFn: (rewardId: string) => fantasyShopService.purchase(rewardId),
    onSuccess: (data) => {
      queryClient.setQueryData(shopQueryKey, data)
      void queryClient.invalidateQueries({ queryKey: shopQueryKey })
      void queryClient.invalidateQueries({ queryKey: rewardsQueryKey })
      toast.success('Предмет в инвентаре', {
        description: `Списано ${confirmReward?.price ?? '—'} очков · осталось ${data.fantasyPointsBalance}`,
      })
      setDialogOpen(false)
      setConfirmReward(null)
    },
    onError: (e) => {
      toast.error('Покупка не выполнена', { description: getRestErrorMessage(e) })
    },
  })

  function openConfirm(reward: FantasyShopRewardDto) {
    if (!user) return
    setConfirmReward(reward)
    setDialogOpen(true)
  }

  function handleConfirmPurchase() {
    if (!confirmReward) return
    purchaseMutation.mutate(confirmReward.id)
  }

  if (rewardsQuery.isPending || (user && meQuery.isPending)) {
    return <PageLoader message="Загрузка магазина…" />
  }

  if (rewardsQuery.isError || (user && meQuery.isError)) {
    return (
      <PageContainer title="Магазин" tagline="Награды" description="Не удалось загрузить данные магазина.">
        <p className="text-sm text-destructive">{getRestErrorMessage(rewardsQuery.error ?? meQuery.error)}</p>
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          onClick={() => {
            void rewardsQuery.refetch()
            if (user) void meQuery.refetch()
          }}
        >
          Повторить
        </Button>
      </PageContainer>
    )
  }

  const rewards = rewardsQuery.data ?? []

  return (
    <>
      <PageContainer
        variant="wide"
        title="Скины и девайсы"
        description="Скины, персонажи и игровая периферия за очки фэнтези — награды сохраняются в вашем инвентаре."
        tagline="Магазин наград"
        actions={
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-wrap items-center justify-end gap-2"
          >
            {user ? (
              <>
                <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 shadow-inner">
                  <Coins className="h-5 w-5 text-primary" aria-hidden />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Баланс</p>
                    <p className="font-mono text-xl font-bold tabular-nums leading-none text-foreground">{balance}</p>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">очков</span>
                </div>
                <Badge variant="outline" className="h-9 border-border px-3 py-1.5 text-xs font-normal text-muted-foreground">
                  <Package className="mr-1.5 h-3.5 w-3.5" />
                  В инвентаре: {inventoryTotal}
                </Badge>
              </>
            ) : (
              <Button asChild variant="outline" size="sm" className="shrink-0">
                <Link to="/login" state={{ from: '/fantasy-shop' }}>
                  Войти для покупки
                </Link>
              </Button>
            )}
          </motion.div>
        }
      >
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_min(22rem,32%)]">
          <section>
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Каталог</h2>
                <p className="text-sm text-muted-foreground">
                  Скины для превью состава и виртуальные девайсы для коллекции — как в лутбоксе арены.
                </p>
              </div>
            </div>
            {rewards.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-10 text-center text-sm text-muted-foreground">
                Каталог пока пуст. Награды появятся, когда администратор добавит их в панели управления.
              </p>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {rewards.map((reward, i) => (
                  <RewardCard
                    key={reward.id}
                    reward={reward}
                    balance={balance}
                    guest={!user}
                    onPurchase={openConfirm}
                    index={i}
                  />
                ))}
              </div>
            )}
          </section>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Card className="border-border/80 bg-card/70 backdrop-blur-md">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Package className="h-4 w-4 text-primary" />
                  Инвентарь
                </CardTitle>
                <CardDescription>
                  {user ? 'Скины и предметы в вашей коллекции.' : 'Войдите, чтобы видеть инвентарь и баланс очков.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {!user ? (
                  <p className="rounded-lg border border-dashed border-border bg-muted/30 px-3 py-6 text-center text-sm text-muted-foreground">
                    Гостевой просмотр каталога.{' '}
                    <Link to="/login" className="font-medium text-primary underline-offset-2 hover:underline" state={{ from: '/fantasy-shop' }}>
                      Войти
                    </Link>
                    , чтобы покупать предметы за очки фэнтези.
                  </p>
                ) : inventory.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border bg-muted/30 px-3 py-6 text-center text-sm text-muted-foreground">
                    Пока пусто — выберите скин или девайс слева.
                  </p>
                ) : (
                  <ul className="max-h-[min(28rem,50vh)] space-y-2 overflow-y-auto pr-1">
                    {inventory.map((row) => (
                      <li
                        key={row.reward.id}
                        className="flex gap-3 rounded-lg border border-border/60 bg-muted/25 p-2.5 transition-colors hover:bg-muted/40"
                      >
                        <img
                          src={row.reward.image}
                          alt=""
                          className="h-14 w-14 shrink-0 rounded-md border border-border object-cover"
                          loading="lazy"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{row.reward.title}</p>
                          <p className="text-xs text-muted-foreground">× {row.quantity}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      </PageContainer>

      {user ? (
        <PurchaseRewardDialog
          open={dialogOpen}
          onOpenChange={(o) => {
            setDialogOpen(o)
            if (!o) setConfirmReward(null)
          }}
          reward={confirmReward}
          balance={balance}
          onConfirm={handleConfirmPurchase}
          isPending={purchaseMutation.isPending}
        />
      ) : null}
    </>
  )
}
