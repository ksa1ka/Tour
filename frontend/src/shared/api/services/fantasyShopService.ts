import { api } from '../client'

export type FantasyShopRewardDto = {
  id: string
  title: string
  description: string
  price: number
  image: string
  sortOrder: number
}

export type FantasyShopInventoryItemDto = {
  reward: FantasyShopRewardDto
  quantity: number
  acquiredAt: string
}

export type FantasyShopMeDto = {
  fantasyPointsBalance: number
  inventory: FantasyShopInventoryItemDto[]
}

export const fantasyShopService = {
  listRewards() {
    return api.get<{ rewards: FantasyShopRewardDto[] }>('/fantasy-shop/rewards').then((r) => r.data.rewards)
  },

  getMe() {
    return api.get<FantasyShopMeDto>('/fantasy-shop/me').then((r) => r.data)
  },

  purchase(rewardId: string) {
    return api.post<FantasyShopMeDto>('/fantasy-shop/purchase', { rewardId }).then((r) => r.data)
  },
}
