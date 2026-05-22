export type SiteNavItem = {

  to: string

  label: string

  end?: boolean

  /** Показывать только администраторам */

  adminOnly?: boolean

  /** Только для авторизованных */

  authOnly?: boolean

  /** Подсказка при наведении */

  title?: string

}



/** Горизонтальная шапка (короткие подписи — полные в title) */

export const SITE_TOPBAR_NAV_ITEMS: SiteNavItem[] = [

  { to: '/', label: 'Главная', end: true, title: 'Главная страница' },

  {

    to: '/tournaments',

    label: 'Турниры',

    end: true,

    title: 'Каталог турниров: формат, статус, переход к карточке',

  },

  { to: '/tournaments/new', label: 'Создать', adminOnly: true, title: 'Создание турнира' },

  {

    to: '/tournaments/matches',

    label: 'Матчи',

    end: true,

    title: 'Матчи и результаты по турнирам',

  },

  {

    to: '/tournaments/fantasy',

    label: 'Фэнтези',

    end: true,

    title: 'Фэнтези-лига',

  },

  { to: '/teams', label: 'Команды', authOnly: true, title: 'Команды и игроки' },

  { to: '/profile', label: 'Профиль', authOnly: true, title: 'Личный кабинет' },

  {

    to: '/fantasy-shop',

    label: 'Магазин',

    title: 'Магазин наград за очки фэнтези',

  },

]


