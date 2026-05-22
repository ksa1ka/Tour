import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { FantasyShopRewardDto } from '@/shared/api/services/fantasyShopService'

type PurchaseRewardDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  reward: FantasyShopRewardDto | null
  balance: number
  onConfirm: () => void
  isPending: boolean
}

export function PurchaseRewardDialog({
  open,
  onOpenChange,
  reward,
  balance,
  onConfirm,
  isPending,
}: PurchaseRewardDialogProps) {
  if (!reward) return null

  const nextBalance = balance - reward.price
  const affordable = balance >= reward.price

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border/80 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Подтвердить покупку</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-3 pt-1 text-left text-sm text-muted-foreground">
              <p>
                Вы покупаете предмет <span className="font-medium text-foreground">{reward.title}</span> за{' '}
                <span className="font-mono tabular-nums text-primary">{reward.price}</span> очков фэнтези.
              </p>
              <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-muted/40 p-3 text-xs sm:text-sm">
                <div>
                  <p className="text-muted-foreground">Текущий баланс</p>
                  <p className="font-mono text-base font-semibold tabular-nums text-foreground">{balance}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">После покупки</p>
                  <p
                    className={`font-mono text-base font-semibold tabular-nums ${affordable ? 'text-foreground' : 'text-destructive'}`}
                  >
                    {affordable ? nextBalance : '—'}
                  </p>
                </div>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Отмена
          </Button>
          <Button type="button" onClick={onConfirm} disabled={!affordable || isPending} className="min-w-[8rem] gap-2">
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Покупка…
              </>
            ) : (
              'Купить'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
