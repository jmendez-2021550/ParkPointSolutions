import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function RoleRoute({ allow }) {
  const { user } = useAuth();
  if (!allow.includes(user?.role)) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
