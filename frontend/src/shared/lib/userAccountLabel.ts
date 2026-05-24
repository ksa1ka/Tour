/** Подписи роли аккаунта для интерфейса. */
export function accountCategoryLabel(role: string): string {
  if (role === 'ADMIN') return 'Администратор'
  if (role === 'PLAYER') return 'Игрок'
  return 'Зритель'
}

export function isAdminRole(role: string | null | undefined): boolean {
  return role === 'ADMIN'
}

/** Вариант бейджа для роли аккаунта. */
export function accountRoleBadgeVariant(role: string): 'default' | 'secondary' | 'outline' {
  if (role === 'ADMIN') return 'default'
  if (role === 'PLAYER') return 'secondary'
  return 'outline'
}
