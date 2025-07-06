import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';
import { auth0Config } from './auth0-config';
import Login from './components/Login';
import TaskList from './pages/TaskList';

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

// ナビゲーション処理を行うコンポーネント
const AppContent: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Auth0Provider 
      {...auth0Config}
      onRedirectCallback={(appState) => {
        // リダイレクト後の処理をカスタマイズ
        console.log('Redirect callback:', appState);
        // ユーザーを意図したページにリダイレクト
        window.history.replaceState(
          {},
          document.title,
          appState?.returnTo || window.location.pathname
        );
        // 必要に応じてナビゲーションを実行
        if (appState?.returnTo) {
          navigate(appState.returnTo);
        }
      }}
    >
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
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Auth0Provider>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App; 