import { useAuth } from "@/features/auth/contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";

interface UserRouteProps {
  children: React.ReactNode;
}

const UserRoute = ({ children }: UserRouteProps) => {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login page with the attempted location
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Admin users should not access user dashboard - redirect to admin panel
  if (isAdmin()) {
    console.log('Admin trying to access user dashboard - redirecting to admin');
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};

export default UserRoute;