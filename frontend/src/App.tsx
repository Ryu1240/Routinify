import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from 'react-router-dom';
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';
import { auth0Config } from './auth0-config';
import { Login } from '@/shared/components/auth';
import { TaskList } from './pages/tasks';
import { CategoryList } from './pages/categories';
import { RoutineTaskList } from './pages/routineTasks';
import { RoutineTaskForm } from './pages/routineTasks/RoutineTaskForm';
import { MilestonesPage, MilestoneDetailPage } from './pages/milestones';
import {
  AchievementListPage,
  AchievementDetailPage,
} from './pages/achievements';
import { AccountManagementPage } from './pages/admin';
import { useHasAdminRole } from '@/shared/hooks/useHasAdminRole';
import { useAuth } from '@/shared/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// 認証が必要なルートを保護するコンポーネント
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Admin権限保護用のラッパーコンポーネント
const AdminRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const hasAdminRole = useHasAdminRole();
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!hasAdminRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// ナビゲーション処理を行うコンポーネント
const AppContent: React.FC = () => {
  const navigate = useNavigate();

  // Auth0のリダイレクト処理をここで行う
  React.useEffect(() => {
    const handleRedirect = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const returnTo = urlParams.get('returnTo');
      if (returnTo) {
        navigate(returnTo);
      }
    };

    handleRedirect();
  }, [navigate]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/tasks"
        element={
          <ProtectedRoute>
            <TaskList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/categories"
        element={
          <ProtectedRoute>
            <CategoryList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/routine-tasks"
        element={
          <ProtectedRoute>
            <RoutineTaskList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/routine-tasks/:id"
        element={
          <ProtectedRoute>
            <RoutineTaskForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/milestones"
        element={
          <ProtectedRoute>
            <MilestonesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/milestones/:id"
        element={
          <ProtectedRoute>
            <MilestoneDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/achievements"
        element={
          <ProtectedRoute>
            <AchievementListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/achievements/:id"
        element={
          <ProtectedRoute>
            <AchievementDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/accounts"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <AccountManagementPage />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/tasks" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Auth0Provider
      {...auth0Config}
      onRedirectCallback={(appState) => {
        // リダイレクト後の処理をカスタマイズ
        // eslint-disable-next-line no-console
        console.log('Redirect callback:', appState);
        // ユーザーを意図したページにリダイレクト
        window.history.replaceState(
          {},
          document.title,
          appState?.returnTo || window.location.pathname
        );
      }}
    >
      <Router>
        <AppContent />
      </Router>
    </Auth0Provider>
  );
};

export default App;
