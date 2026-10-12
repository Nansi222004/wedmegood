import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // Not signed in: go straight to the login screen, and come back to this page afterwards
  if (!isAuthenticated) {
    const back = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${back}`} replace />;
  }

  // If authenticated, render the protected component
  return children;
};

export default ProtectedRoute;