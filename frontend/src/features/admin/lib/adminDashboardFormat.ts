export function formatAdminCount(value: number): string {
  return value.toLocaleString('ru-RU')
}

export function formatAdminPercentChange(percent: number | null): { label: string; positive?: boolean } {
  if (percent === null) {
    return { label: 'нет сравнения с прошлым периодом' }
  }
  const sign = percent >= 0 ? '+' : ''
  return {
    label: `${sign}${percent.toLocaleString('ru-RU', { maximumFractionDigits: 1 })}% за 30 дней`,
    positive: percent >= 0,
  }
}

export function formatShortDayLabel(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

const TOURNAMENT_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Черновик',
  OPEN: 'Открыт',
  REGISTRATION: 'Регистрация',
  CLOSED: 'Закрыт',
  IN_PROGRESS: 'Идёт',
  COMPLETED: 'Завершён',
  CANCELLED: 'Отменён',
}

export function tournamentStatusLabel(status: string): string {
  return TOURNAMENT_STATUS_LABELS[status] ?? status
}
