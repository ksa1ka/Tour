import { useQuery } from '@tanstack/react-query'

import { api } from '@/services/api'

export type AdminRewardPurchaseListItem = {
  id: string
  quantity: number
  acquiredAt: string
  userId: string
  userEmail: string
  userDisplayName: string | null
  rewardId: string
  rewardTitle: string
  rewardPrice: number
}

type Response = { purchases: AdminRewardPurchaseListItem[] }

export function useAdminShopPurchasesQuery(enabled: boolean) {
  return useQuery({
    queryKey: ['admin', 'shop-purchases'],
    enabled,
    queryFn: async () => {
      const { data } = await api.get<Response>('/admin/shop-purchases')
      return data.purchases
    },
  })
}
