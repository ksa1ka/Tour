import { useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ImageIcon, Pencil, RefreshCw } from 'lucide-react'
import { useCallback, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/AuthContext'
import {
  adminShopRewardsQueryKey,
  useAdminShopRewardsQuery,
  useUpdateShopRewardImageMutation,
  type AdminShopRewardListItem,
} from '@/features/admin/api/useAdminShopRewardsQuery'
import { getRestErrorMessage } from '@/shared/lib/restErrors'
import { PageLoader } from '@/shared/ui/PageLoader'
import { AdminCrudTable, type AdminTableColumn } from '@/widgets/admin-dashboard/ui/AdminCrudTable'
import { toast } from 'sonner'

const MAX_IMAGE_FILE_BYTES = 1_800_000

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const r = reader.result
      if (typeof r === 'string') resolve(r)
      else reject(new Error('Не удалось прочитать файл'))
    }
    reader.onerror = () => reject(reader.error ?? new Error('Ошибка чтения файла'))
    reader.readAsDataURL(file)
  })
}

export function AdminShopRewardsPage() {
  const { user } = useAuth()
  const enabled = user?.role === 'ADMIN'
  const queryClient = useQueryClient()
  const listQuery = useAdminShopRewardsQuery(enabled)

  const updateMutation = useUpdateShopRewardImageMutation()

  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<AdminShopRewardListItem | null>(null)
  const [imageUrl, setImageUrl] = useState('')

  const openEdit = useCallback((r: AdminShopRewardListItem) => {
    setEditing(r)
    setImageUrl(r.image)
    setEditOpen(true)
  }, [])

  const closeEdit = useCallback(() => {
    setEditOpen(false)
    setEditing(null)
    setImageUrl('')
  }, [])

  const handlePickFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.target.value = ''
      if (!file || !file.type.startsWith('image/')) {
        toast.error('Выберите файл изображения (PNG, JPEG, WebP, GIF)')
        return
      }
      if (file.size > MAX_IMAGE_FILE_BYTES) {
        toast.error('Файл слишком большой', { description: 'Максимум ~1,7 МБ для загрузки в базу.' })
        return
      }
      try {
        const dataUrl = await readFileAsDataUrl(file)
        setImageUrl(dataUrl)
      } catch {
        toast.error('Не удалось прочитать файл')
      }
    },
    [],
  )

  const handleSaveImage = async () => {
    if (!editing) return
    const trimmed = imageUrl.trim()
    if (!trimmed) {
      toast.error('Укажите ссылку на картинку или загрузите файл')
      return
    }
    try {
      await updateMutation.mutateAsync({ rewardId: editing.id, image: trimmed })
      toast.success('Картинка обновлена', { description: editing.title })
      closeEdit()
    } catch (err) {
      toast.error('Не сохранено', { description: getRestErrorMessage(err) })
    }
  }

  const rows = listQuery.data ?? []

  const columns: AdminTableColumn<AdminShopRewardListItem>[] = [
    {
      id: 'thumb',
      header: '',
      cell: (r) => (
        <img
          src={r.image}
          alt=""
          className="h-12 w-12 rounded-md border border-border object-cover"
          loading="lazy"
        />
      ),
      className: 'w-[1%]',
    },
    {
      id: 'title',
      header: 'Товар',
      cell: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{r.title}</p>
          <p className="line-clamp-2 text-xs text-muted-foreground">{r.description}</p>
        </div>
      ),
    },
    {
      id: 'price',
      header: 'Цена',
      cell: (r) => <span className="whitespace-nowrap font-mono text-sm tabular-nums">{r.price} очков</span>,
      className: 'w-[1%]',
    },
    {
      id: 'actions',
      header: '',
      cell: (r) => (
        <Button type="button" variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={() => openEdit(r)}>
          <Pencil className="h-3.5 w-3.5" />
          Картинка
        </Button>
      ),
      className: 'w-[1%] whitespace-nowrap',
    },
  ]

  if (user?.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Магазин наград</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Картинки товаров</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Обновите превью товаров в каталоге: укажите ссылку на картинку или загрузите файл с компьютера — как для
            аватаров в профиле.
          </p>
        </motion.div>
        <Button
          type="button"
          variant="outline"
          className="shrink-0 gap-2"
          disabled={listQuery.isFetching}
          onClick={() => void queryClient.invalidateQueries({ queryKey: adminShopRewardsQueryKey })}
        >
          <RefreshCw className={`h-4 w-4 ${listQuery.isFetching ? 'animate-spin' : ''}`} />
          Обновить
        </Button>
      </div>

      {listQuery.isError ? (
        <p className="text-sm text-destructive">
          {listQuery.error instanceof Error ? listQuery.error.message : 'Не удалось загрузить'}
        </p>
      ) : null}

      {listQuery.isPending ? (
        <PageLoader message="Загрузка каталога…" />
      ) : (
        <AdminCrudTable
          caption="Товары магазина: превью в каталоге и инвентаре"
          columns={columns}
          data={rows}
          getRowId={(r) => r.id}
          emptyLabel="В каталоге пока нет товаров"
        />
      )}

      <Dialog open={editOpen} onOpenChange={(o) => !o && closeEdit()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              Картинка товара
            </DialogTitle>
            <DialogDescription>
              {editing?.title ?? ''} — укажите ссылку на изображение или загрузите файл с диска.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-center rounded-lg border border-border bg-muted/30 p-4">
              {imageUrl ? (
                <img src={imageUrl} alt="" className="max-h-48 max-w-full rounded-md object-contain" />
              ) : (
                <p className="text-sm text-muted-foreground">Нет превью</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="reward-image-url">Ссылка на картинку</Label>
              <Input
                id="reward-image-url"
                type="url"
                placeholder="https://example.com/skin.png"
                value={imageUrl.startsWith('data:') ? '' : imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reward-image-file">Или файл с компьютера</Label>
              <Input id="reward-image-file" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handlePickFile} />
              {imageUrl.startsWith('data:') ? (
                <p className="text-xs text-muted-foreground">Сейчас выбран загруженный файл (data URL).</p>
              ) : null}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={closeEdit}>
              Отмена
            </Button>
            <Button type="button" onClick={() => void handleSaveImage()} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Сохранение…' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
