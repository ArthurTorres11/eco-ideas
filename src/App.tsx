import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./features/auth/pages/LoginPage";
import ForgotPasswordPage from "./features/auth/pages/ForgotPasswordPage";
import ResetPasswordPage from "./features/auth/pages/ResetPasswordPage";
import DashboardPage from "./features/ideas/pages/DashboardPage";
import NewIdeaPage from "./features/ideas/pages/NewIdeaPage";
import ReportsPage from "./features/ideas/pages/ReportsPage";
import NotFound from "./pages/NotFound";
import { AdminLayout } from "./layouts/AdminLayout";
import AdminDashboard from "./features/admin/pages/AdminDashboard";
import ManageIdeas from "./features/admin/pages/ManageIdeas";
import EvaluateIdea from "./features/admin/pages/EvaluateIdea";
import ManageUsers from "./features/admin/pages/ManageUsers";
import UserForm from "./features/admin/pages/UserForm";
import Settings from "./features/admin/pages/Settings";
import GoalsSettings from "./features/admin/pages/GoalsSettings";
import RankingPage from "./features/admin/pages/RankingPage";
import ProtectedRoute from "./features/auth/components/ProtectedRoute";
import AdminRoute from "./features/auth/components/AdminRoute";
import UserRoute from "./features/auth/components/UserRoute";
import { AuthProvider } from "./features/auth/contexts/AuthContext";
import { IdeasProvider } from "./features/ideas/contexts/IdeasContext";

// Create a stable QueryClient instance with proper error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <IdeasProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <UserRoute>
                    <DashboardPage />
                  </UserRoute>
                </ProtectedRoute>
              } />
              <Route path="/new-idea" element={
                <ProtectedRoute>
                  <UserRoute>
                    <NewIdeaPage />
                  </UserRoute>
                </ProtectedRoute>
              } />
              
              {/* Admin Routes */}
              <Route path="/admin" element={
                <ProtectedRoute>
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                </ProtectedRoute>
              }>
                <Route index element={<AdminDashboard />} />
                <Route path="ideas" element={<ManageIdeas />} />
                <Route path="ideas/:ideaId/evaluate" element={<EvaluateIdea />} />
                <Route path="users" element={<ManageUsers />} />
                <Route path="users/:userId/edit" element={<UserForm />} />
                <Route path="users/new" element={<UserForm />} />
                <Route path="goals" element={<GoalsSettings />} />
                <Route path="ranking" element={<RankingPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="settings" element={<Settings />} />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </IdeasProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;