import { BadRequestError, NotFoundError } from '../errors/HttpError.js'
import { prisma } from '../prisma/client.js'

export type ShopRewardDto = {
  id: string
  title: string
  description: string
  price: number
  image: string
  sortOrder: number
}

export type ShopInventoryItemDto = {
  reward: ShopRewardDto
  quantity: number
  acquiredAt: string
}

export type ShopMeDto = {
  fantasyPointsBalance: number
  inventory: ShopInventoryItemDto[]
}

function mapReward(r: {
  id: string
  title: string
  description: string
  price: number
  image: string
  sortOrder: number
}): ShopRewardDto {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    price: r.price,
    image: r.image,
    sortOrder: r.sortOrder,
  }
}

export async function listShopRewards(): Promise<ShopRewardDto[]> {
  const rows = await prisma.reward.findMany({
    orderBy: [{ sortOrder: 'asc' }, { price: 'asc' }],
  })
  return rows.map(mapReward)
}

export async function getShopMe(userId: string): Promise<ShopMeDto> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      fantasyPointsBalance: true,
      rewardInventory: {
        orderBy: { updatedAt: 'desc' },
        include: { reward: true },
      },
    },
  })
  if (!user) {
    throw new NotFoundError('User not found')
  }

  return {
    fantasyPointsBalance: user.fantasyPointsBalance,
    inventory: user.rewardInventory.map((row) => ({
      reward: mapReward(row.reward),
      quantity: row.quantity,
      acquiredAt: row.acquiredAt.toISOString(),
    })),
  }
}

export async function purchaseReward(userId: string, rewardId: string): Promise<ShopMeDto> {
  return prisma.$transaction(async (tx) => {
    const reward = await tx.reward.findUnique({ where: { id: rewardId } })
    if (!reward) {
      throw new NotFoundError('Reward not found')
    }
    if (reward.price < 0) {
      throw new BadRequestError('Invalid reward price')
    }

    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { fantasyPointsBalance: true },
    })
    if (!user) {
      throw new NotFoundError('User not found')
    }
    if (user.fantasyPointsBalance < reward.price) {
      throw new BadRequestError('Недостаточно fantasy points')
    }

    await tx.user.update({
      where: { id: userId },
      data: { fantasyPointsBalance: { decrement: reward.price } },
    })

    await tx.userReward.upsert({
      where: { userId_rewardId: { userId, rewardId } },
      create: { userId, rewardId, quantity: 1 },
      update: { quantity: { increment: 1 } },
    })

    const next = await tx.user.findUnique({
      where: { id: userId },
      select: {
        fantasyPointsBalance: true,
        rewardInventory: {
          orderBy: { updatedAt: 'desc' },
          include: { reward: true },
        },
      },
    })
    if (!next) {
      throw new NotFoundError('User not found')
    }

    return {
      fantasyPointsBalance: next.fantasyPointsBalance,
      inventory: next.rewardInventory.map((row) => ({
        reward: mapReward(row.reward),
        quantity: row.quantity,
        acquiredAt: row.acquiredAt.toISOString(),
      })),
    }
  })
}
