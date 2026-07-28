import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function PrivateRoute() {
  const { token, loading } = useAuth();
  if (loading) return <div className="loading-box"><div className="spinner" /></div>;
  return token ? <Outlet /> : <Navigate to="/welcome" replace />;
}
