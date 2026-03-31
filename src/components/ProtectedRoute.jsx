import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user } = useAuth();

  if (!user) {
    // If not logged in, redirect to auth page
    return <Navigate to="/auth" replace />;
  }

  return children;
}
