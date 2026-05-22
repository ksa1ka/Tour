import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import {
  CalendarDays,
  ImageIcon,
  LayoutDashboard,
  LifeBuoy,
  Shield,
  ShoppingBag,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'

import { ADMIN_ROUTES } from '@/shared/constants/adminRoutes'
import { cn } from '@/shared/lib/utils'

const rowBase =
  'group/row flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm font-semibold tracking-tight text-muted-foreground transition-all duration-200 hover:border-border hover:bg-muted/50 hover:text-foreground'

function AdminNavLink({
  to,
  end,
  icon: Icon,
  children,
  onNavigate,
}: {
  to: string
  end?: boolean
  icon: LucideIcon
  children: ReactNode
  onNavigate?: () => void
}) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className="block w-full rounded-xl no-underline text-inherit outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {({ isActive }) => (
        <span
          className={cn(
            rowBase,
            isActive &&
              'border-primary/35 bg-primary/10 text-foreground shadow-glow-sm',
          )}
        >
          <span
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-all duration-200',
              isActive
                ? 'border-primary/45 bg-primary/18 text-primary shadow-glow-sm'
                : 'border-border/90 bg-muted/40 text-muted-foreground group-hover/row:text-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
          {children}
        </span>
      )}
    </NavLink>
  )
}

const navItems = [
  { to: ADMIN_ROUTES.dashboard, icon: LayoutDashboard, label: 'Обзор' },
  { to: ADMIN_ROUTES.users, icon: Users, label: 'Пользователи' },
  { to: ADMIN_ROUTES.tournaments, icon: Trophy, label: 'Турниры' },
  { to: ADMIN_ROUTES.matches, icon: CalendarDays, label: 'Матчи' },
  { to: ADMIN_ROUTES.teams, icon: Shield, label: 'Команды' },
  { to: ADMIN_ROUTES.fantasyLeague, icon: Sparkles, label: 'Фэнтези' },
  { to: ADMIN_ROUTES.shopPurchases, icon: ShoppingBag, label: 'Покупки' },
  { to: ADMIN_ROUTES.shopRewards, icon: ImageIcon, label: 'Фото магазина' },
  { to: ADMIN_ROUTES.support, icon: LifeBuoy, label: 'Поддержка' },
] as const

type AdminSidebarProps = {
  className?: string
  onNavigate?: () => void
  variant?: 'rail' | 'drawer'
}

export function AdminSidebar({ className, onNavigate, variant = 'rail' }: AdminSidebarProps) {
  const isDrawer = variant === 'drawer'

  return (
    <motion.aside
      initial={isDrawer ? false : { opacity: 0, x: -10 }}
      animate={isDrawer ? false : { opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'flex w-56 shrink-0 flex-col lg:w-60',
        isDrawer
          ? 'border-0 bg-transparent'
          : 'hidden rounded-none border-y-0 border-l-0 border-r border-border/90 bg-card/90 shadow-[1px_0_0_0_hsl(0_0%_100%/0.65)_inset] backdrop-blur-xl md:flex',
        className,
      )}
    >
      <div className="flex flex-1 flex-col gap-7 p-3 pt-6 lg:p-4">
        <div>
          <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.24em] text-primary/90">
            Админ-панель
          </p>
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <AdminNavLink
                key={item.to}
                to={item.to}
                end={item.to === ADMIN_ROUTES.root}
                icon={item.icon}
                onNavigate={onNavigate}
              >
                {item.label}
              </AdminNavLink>
            ))}
          </nav>
        </div>
        <div className="mt-auto rounded-xl border border-border/90 bg-muted/30 p-3 text-xs text-muted-foreground backdrop-blur-sm">
          <p className="font-bold text-foreground">Сводка и отчёты</p>
          <p className="mt-1 leading-relaxed">Здесь собраны ключевые разделы: пользователи, турниры, матчи и магазин.</p>
          <Link
            to="/"
            className="mt-2 inline-flex text-[11px] font-bold uppercase tracking-wide text-primary transition-colors hover:text-primary/85"
            onClick={onNavigate}
          >
            ← На сайт
          </Link>
        </div>
      </div>
    </motion.aside>
  )
}
