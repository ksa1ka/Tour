export const profileQueryKeys = {
  all: ['profile'] as const,
  byUserId: (userId: string) => ['profile', 'user', userId] as const,
}
