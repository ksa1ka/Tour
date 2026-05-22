import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AdminRoute } from '@/app/AdminRoute'
import { ProtectedRoute } from '@/app/ProtectedRoute'
import { SupportProvider } from '@/features/support/model/supportContext'
import { RootLayout } from '@/layouts/RootLayout'
import { PageLoader } from '@/shared/ui/PageLoader'

const HomePage = lazy(() => import('@/pages/HomePage').then((m) => ({ default: m.HomePage })))
const LoginPage = lazy(() => import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('@/pages/RegisterPage').then((m) => ({ default: m.RegisterPage })))
const TournamentsPage = lazy(() =>
  import('@/pages/TournamentsPage').then((m) => ({ default: m.TournamentsPage })),
)
const TournamentMatchesHubPage = lazy(() =>
  import('@/pages/TournamentMatchesHubPage').then((m) => ({ default: m.TournamentMatchesHubPage })),
)
const TournamentFantasyHubPage = lazy(() =>
  import('@/pages/TournamentFantasyHubPage').then((m) => ({ default: m.TournamentFantasyHubPage })),
)
const TournamentFantasyPickPage = lazy(() =>
  import('@/pages/TournamentFantasyPickPage').then((m) => ({ default: m.TournamentFantasyPickPage })),
)
const TournamentDetailPage = lazy(() =>
  import('@/pages/TournamentDetailPage').then((m) => ({ default: m.TournamentDetailPage })),
)
const TournamentFantasyPage = lazy(() =>
  import('@/pages/TournamentFantasyPage').then((m) => ({ default: m.TournamentFantasyPage })),
)
const TournamentFantasyLeaderboardPage = lazy(() =>
  import('@/pages/TournamentFantasyLeaderboardPage').then((m) => ({ default: m.TournamentFantasyLeaderboardPage })),
)
const FantasyShopPage = lazy(() => import('@/pages/FantasyShopPage').then((m) => ({ default: m.FantasyShopPage })))
const CreateTournamentPage = lazy(() =>
  import('@/pages/CreateTournamentPage').then((m) => ({ default: m.CreateTournamentPage })),
)
const TeamsManagementPage = lazy(() =>
  import('@/pages/TeamsManagementPage').then((m) => ({ default: m.TeamsManagementPage })),
)
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })))
const ProfileSettingsPage = lazy(() =>
  import('@/pages/ProfileSettingsPage').then((m) => ({ default: m.ProfileSettingsPage })),
)
const UserProfilePage = lazy(() =>
  import('@/pages/UserProfilePage').then((m) => ({ default: m.UserProfilePage })),
)
const AdminLayout = lazy(() =>
  import('@/widgets/admin-shell/ui/AdminLayout').then((m) => ({ default: m.AdminLayout })),
)
const AdminDashboardPage = lazy(() =>
  import('@/pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })),
)
const AdminUsersPage = lazy(() =>
  import('@/pages/admin/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage })),
)
const AdminTournamentsPage = lazy(() =>
  import('@/pages/admin/AdminTournamentsPage').then((m) => ({ default: m.AdminTournamentsPage })),
)
const AdminMatchesPage = lazy(() =>
  import('@/pages/admin/AdminMatchesPage').then((m) => ({ default: m.AdminMatchesPage })),
)
const AdminTeamsPage = lazy(() =>
  import('@/pages/admin/AdminTeamsPage').then((m) => ({ default: m.AdminTeamsPage })),
)
const AdminFantasyLeaguePage = lazy(() =>
  import('@/pages/admin/AdminFantasyLeaguePage').then((m) => ({ default: m.AdminFantasyLeaguePage })),
)
const AdminShopPurchasesPage = lazy(() =>
  import('@/pages/admin/AdminShopPurchasesPage').then((m) => ({ default: m.AdminShopPurchasesPage })),
)
const AdminShopRewardsPage = lazy(() =>
  import('@/pages/admin/AdminShopRewardsPage').then((m) => ({ default: m.AdminShopRewardsPage })),
)
const AdminSupportPage = lazy(() =>
  import('@/pages/admin/AdminSupportPage').then((m) => ({ default: m.AdminSupportPage })),
)

function PageFallback() {
  return <PageLoader message="Загрузка страницы…" />
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <SupportProvider>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route element={<RootLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Каталог и карточки турниров — как на API, без обязательного входа */}
              <Route path="/tournaments/matches" element={<TournamentMatchesHubPage />} />
              <Route path="/tournaments/fantasy/pick" element={<TournamentFantasyPickPage />} />
              <Route path="/tournaments/fantasy" element={<TournamentFantasyHubPage />} />
              <Route path="/tournaments" element={<TournamentsPage />} />
              <Route path="/tournaments/:id/fantasy/leaderboard" element={<TournamentFantasyLeaderboardPage />} />
              <Route path="/tournaments/:id/fantasy" element={<TournamentFantasyPage />} />
              <Route path="/tournaments/:id" element={<TournamentDetailPage />} />

              <Route path="/fantasy-shop" element={<FantasyShopPage />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/profile/settings" element={<ProfileSettingsPage />} />
                <Route path="/users/:userId" element={<UserProfilePage />} />
                <Route path="/teams" element={<TeamsManagementPage />} />
                <Route element={<AdminRoute />}>
                  <Route path="admin" element={<AdminLayout />}>
                    <Route index element={<AdminDashboardPage />} />
                    <Route path="users" element={<AdminUsersPage />} />
                    <Route path="tournaments" element={<AdminTournamentsPage />} />
                    <Route path="matches" element={<AdminMatchesPage />} />
                    <Route path="teams" element={<AdminTeamsPage />} />
                    <Route path="fantasy-league" element={<AdminFantasyLeaguePage />} />
                    <Route path="shop-purchases" element={<AdminShopPurchasesPage />} />
                    <Route path="shop-rewards" element={<AdminShopRewardsPage />} />
                    <Route path="support" element={<AdminSupportPage />} />
                  </Route>
                  <Route path="/tournaments/new" element={<CreateTournamentPage />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Suspense>
      </SupportProvider>
    </BrowserRouter>
  )
}
