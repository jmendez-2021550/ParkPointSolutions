import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './shared/components/Layout.jsx';
import PrivateRoute from './shared/components/PrivateRoute.jsx';
import RoleRoute from './shared/components/RoleRoute.jsx';
import LandingPage from './features/landing/LandingPage.jsx';
import LoginPage from './features/auth/LoginPage.jsx';
import RegisterPage from './features/auth/RegisterPage.jsx';
import VerifyEmailPage from './features/auth/VerifyEmailPage.jsx';
import DashboardPage from './features/dashboard/DashboardPage.jsx';
import ParkingMapPage from './features/parking/ParkingMapPage.jsx';
import MyReservationsPage from './features/reservations/MyReservationsPage.jsx';
import ProfilePage from './features/profile/ProfilePage.jsx';
import ReportsPage from './features/reports/ReportsPage.jsx';
import UsersPage from './features/users/UsersPage.jsx';
import FavoritesAdminPage from './features/favorites/FavoritesAdminPage.jsx';
import WalletPage from './features/wallet/WalletPage.jsx';

export default function App() {
  return (
    <Routes>
      {/* Public pages */}
      <Route path="/welcome" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      {/* Protected pages */}
      <Route element={<PrivateRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/parking" element={<ParkingMapPage />} />
          <Route path="/reservations" element={<MyReservationsPage />} />

          {/* Solo clientes */}
          <Route element={<RoleRoute allow={['USER_ROLE', 'ADMIN_ROLE', 'SUPER_ADMIN_ROLE']} />}>
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/wallet" element={<WalletPage />} />
          </Route>

          {/* Admin y Super Admin */}
          <Route element={<RoleRoute allow={['ADMIN_ROLE', 'SUPER_ADMIN_ROLE']} />}>
            <Route path="/reports" element={<ReportsPage />} />
          </Route>

          {/* Solo Super Admin */}
          <Route element={<RoleRoute allow={['SUPER_ADMIN_ROLE']} />}>
            <Route path="/users" element={<UsersPage />} />
            <Route path="/favorites" element={<FavoritesAdminPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/welcome" replace />} />
    </Routes>
  );
}
