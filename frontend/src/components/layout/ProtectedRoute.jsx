import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Spinner from '../common/Spinner.jsx';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) return <Spinner full />;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}
