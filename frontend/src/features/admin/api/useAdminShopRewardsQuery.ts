import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/services/api'

export type AdminShopRewardListItem = {
  id: string
  title: string
  description: string
  price: number
  image: string
  sortOrder: number
}

export const adminShopRewardsQueryKey = ['admin', 'shop-rewards'] as const

type ListResponse = { rewards: AdminShopRewardListItem[] }
type PatchResponse = { reward: AdminShopRewardListItem }

export function useAdminShopRewardsQuery(enabled: boolean) {
  return useQuery({
    queryKey: adminShopRewardsQueryKey,
    enabled,
    queryFn: async () => {
      const { data } = await api.get<ListResponse>('/admin/shop-rewards')
      return data.rewards
    },
  })
}

export function useUpdateShopRewardImageMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ rewardId, image }: { rewardId: string; image: string }) => {
      const { data } = await api.patch<PatchResponse>(`/admin/shop-rewards/${rewardId}`, { image })
      return data.reward
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminShopRewardsQueryKey })
      void queryClient.invalidateQueries({ queryKey: ['fantasy-shop', 'rewards'] })
      void queryClient.invalidateQueries({ queryKey: ['fantasy-shop', 'me'] })
    },
  })
}
