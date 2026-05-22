import { motion } from 'framer-motion'

import { LifeBuoy, LogOut, Shield, Trophy } from 'lucide-react'

import { Link, NavLink, useLocation } from 'react-router-dom'



import { Button } from '@/components/ui/button'

import { useAuth } from '@/context/AuthContext'

import { useSupport } from '@/features/support/model/supportContext'

import { useLogoutMutation } from '@/features/auth/api/useAuthMutations'

import { ADMIN_ROUTES } from '@/shared/constants/adminRoutes'

import { accountCategoryLabel } from '@/shared/lib/userAccountLabel'

import { cn } from '@/shared/lib/utils'

import { SITE_TOPBAR_NAV_ITEMS } from '@/widgets/app-shell/config/siteNavItems'

import { ProfileAvatar } from '@/widgets/profile-stats/ui/ProfileAvatar'



const navLinkClass = ({ isActive }: { isActive: boolean }) =>

  cn(

    'relative shrink-0 whitespace-nowrap rounded-md px-2.5 py-2 text-xs font-semibold uppercase tracking-wide transition-all duration-200 sm:px-3 sm:text-sm',

    isActive

      ? 'text-foreground'

      : 'text-muted-foreground hover:bg-primary/10 hover:text-foreground',

    isActive &&

      'bg-primary/8 text-primary after:absolute after:inset-x-1 after:-bottom-px after:h-[2px] after:bg-primary after:opacity-90',

  )



function isAdminPath(pathname: string) {

  return pathname === '/admin' || pathname.startsWith('/admin/')

}



export function AppNavbar() {

  const { user } = useAuth()

  const { openSupport } = useSupport()

  const logoutMutation = useLogoutMutation()

  const location = useLocation()

  const isAdminArea = isAdminPath(location.pathname)

  const isAdminUser = user?.role === 'ADMIN'



  const topbarNav = SITE_TOPBAR_NAV_ITEMS.filter((item) => {

    if (item.adminOnly && !isAdminUser) return false

    if (item.authOnly && !user) return false

    if (user && item.to === '/profile') return false

    return true

  })



  return (

    <motion.header

      initial={{ y: -14, opacity: 0 }}

      animate={{ y: 0, opacity: 1 }}

      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}

      className="glass-navbar sticky top-0 z-50"

    >

      <div className="relative z-10 mx-auto w-full max-w-[1600px] px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:px-6">

        {/* Верхняя строка: логотип и действия — всегда полностью видны */}

        <div className="flex min-h-[3.25rem] items-center justify-between gap-3 py-2 sm:min-h-[3.5rem]">

          <Link to="/" className="group flex shrink-0 items-center gap-2.5 sm:gap-3">

            <span className="relative flex h-10 w-10 skew-x-[-6deg] items-center justify-center overflow-hidden rounded-md border border-border bg-secondary transition-all duration-300 group-hover:border-primary/40">

              <Trophy className="relative h-5 w-5 skew-x-[6deg] text-primary" strokeWidth={2.25} />

            </span>

            <span className="font-display hidden text-base font-bold uppercase tracking-[0.12em] text-foreground sm:inline sm:text-lg">

              Tour<span className="text-esports-accent"> Arena</span>

            </span>

          </Link>



          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">

            {user ? (

              <>

                <Link

                  to="/profile"

                  className="hidden max-w-[10.5rem] items-center gap-2 truncate rounded-md border border-border/90 bg-card/95 px-2 py-1.5 text-xs text-muted-foreground shadow-inner-glow backdrop-blur-sm transition-all duration-200 hover:border-primary/40 hover:text-foreground sm:max-w-[12rem] md:flex lg:max-w-[15rem] lg:px-2.5 lg:py-2 lg:text-sm"

                >

                  <ProfileAvatar

                    email={user.email}

                    displayName={user.displayName}

                    avatarUrl={user.avatarUrl}

                    size="sm"

                  />

                  <span className="min-w-0 truncate">

                    {user.displayName?.trim() || user.email}

                    <span className="text-muted-foreground"> · </span>

                    {accountCategoryLabel(user.role)}

                  </span>

                </Link>

                <Button

                  type="button"

                  variant="outline"

                  size="sm"

                  className="shrink-0 px-2.5 sm:px-4 sm:text-sm"

                  disabled={logoutMutation.isPending}

                  aria-label={logoutMutation.isPending ? 'Выход…' : 'Выйти'}

                  onClick={() => logoutMutation.mutate()}

                >

                  <LogOut className="h-4 w-4 sm:hidden" aria-hidden />

                  <span className="hidden sm:inline">{logoutMutation.isPending ? 'Выход…' : 'Выйти'}</span>

                </Button>

                {isAdminUser ? (

                  <Button

                    asChild

                    variant="default"

                    size="sm"

                    className="shrink-0 gap-1.5 px-3 sm:px-4 sm:text-sm"

                  >

                    <Link to={ADMIN_ROUTES.root} title="Админ-панель">

                      <Shield className="h-4 w-4" aria-hidden />

                      Админ

                    </Link>

                  </Button>

                ) : null}

              </>

            ) : (

              <>

                <Button asChild variant="ghost" size="sm" className="hidden px-2 sm:inline-flex sm:px-4 sm:text-sm">

                  <Link to="/register">Регистрация</Link>

                </Button>

                <Button asChild size="sm" className="px-3 text-xs sm:px-4 sm:text-sm">

                  <Link to="/login">Войти</Link>

                </Button>

              </>

            )}

          </div>

        </div>



        {/* Нижняя строка: меню на всю ширину, без наезда на профиль */}

        <nav

          className={cn(

            'flex min-w-0 items-center gap-0.5 overflow-x-auto overscroll-x-contain border-t border-border/60 py-1.5 scroll-px-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',

            isAdminArea && 'justify-start md:justify-center',

          )}

          aria-label="Основное меню"

        >

          {isAdminArea ? (

            <NavLink to="/" className={navLinkClass}>

              На сайт

            </NavLink>

          ) : (

            <>

              {topbarNav.map((item) => (

                <NavLink

                  key={`${item.to}-${item.label}`}

                  to={item.to}

                  end={item.end}

                  title={item.title ?? item.label}

                  className={navLinkClass}

                >

                  {item.label}

                </NavLink>

              ))}

              <button

                type="button"

                className={navLinkClass({ isActive: false })}

                onClick={() => openSupport()}

              >

                <span className="inline-flex items-center gap-1.5">

                  <LifeBuoy className="h-4 w-4 text-muted-foreground" />

                  Помощь

                </span>

              </button>

            </>

          )}

        </nav>

      </div>

    </motion.header>

  )

}


