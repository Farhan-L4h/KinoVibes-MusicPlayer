import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth';
import LoadingSpinner from './LoadingSpinner';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuthStore();

  if (loading) {
    return <LoadingSpinner />;
  }

  return user ? children : <Navigate to="/login" />;
};

export default PrivateRoute;