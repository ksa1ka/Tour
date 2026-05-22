/** Подписи роли аккаунта для интерфейса. */
export function accountCategoryLabel(role: string): string {
  if (role === 'ADMIN') return 'Администратор'
  if (role === 'PLAYER') return 'Игрок'
  return 'Зритель'
}
