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
import { TaskListPage } from './pages/tasks';
import { CategoryListPage } from './pages/categories';
import { RoutineTaskListPage, RoutineTaskFormPage } from './pages/routineTasks';
import { MilestonesPage, MilestoneDetailPage } from './pages/milestones';
import {
  AchievementListPage,
  AchievementDetailPage,
} from './pages/achievements';
import { AccountManagementPage } from './pages/admin';
import { ForbiddenPage } from './pages/errors';
import { DashboardPage } from './pages/dashboard';
import { useHasAdminRole } from '@/shared/hooks/useHasAdminRole';

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
// ベストプラクティス: 権限がない場合は403エラーページを表示（リダイレクトではなく）
const AdminRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { hasAdminRole, isLoading } = useHasAdminRole();

  // ローディング中はローディング表示を出す（権限チェック完了を待つ）
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // ローディング完了後に権限チェックを実行
  // ベストプラクティス: リダイレクトではなく、403エラーページを表示
  // これにより、ユーザーに理由を明確に伝えることができる
  if (!hasAdminRole) {
    return <ForbiddenPage />;
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

      // セキュリティ: Open Redirect脆弱性を防ぐため、内部パスのみ許可
      if (returnTo) {
        // 相対パスかつ許可されたパスのみリダイレクト
        const allowedPaths = [
          '/dashboard',
          '/tasks',
          '/categories',
          '/routine-tasks',
          '/milestones',
          '/achievements',
          '/admin/accounts',
        ];
        const isInternalPath =
          returnTo.startsWith('/') && !returnTo.startsWith('//');
        const isAllowedPath = allowedPaths.some((path) =>
          returnTo.startsWith(path)
        );

        if (isInternalPath && isAllowedPath) {
          navigate(returnTo);
        } else {
          // 不正なパスの場合はデフォルトのダッシュボードへ
          console.warn('Invalid redirect path blocked:', returnTo);
          navigate('/dashboard');
        }
      }
    };

    handleRedirect();
  }, [navigate]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks"
        element={
          <ProtectedRoute>
            <TaskListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/categories"
        element={
          <ProtectedRoute>
            <CategoryListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/routine-tasks"
        element={
          <ProtectedRoute>
            <RoutineTaskListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/routine-tasks/:id"
        element={
          <ProtectedRoute>
            <RoutineTaskFormPage />
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
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Auth0Provider
      {...auth0Config}
      onRedirectCallback={(appState) => {
        // リダイレクト後の処理をカスタマイズ
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
