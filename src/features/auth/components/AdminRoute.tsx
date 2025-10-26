import { useAuth } from "@/features/auth/contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
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

  console.log('AdminRoute check:', { user, isAdminResult: isAdmin() });

  if (!isAdmin()) {
    console.log('Access denied - redirecting to dashboard');
    // Redirect non-admin users to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  console.log('Admin access granted');

  return <>{children}</>;
};

export default AdminRoute;