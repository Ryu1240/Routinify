import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from './Login';

// Auth0のモック
const mockLoginWithRedirect = vi.fn();
const mockNavigate = vi.fn();

const mockUseAuth0 = vi.fn();

vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => mockUseAuth0(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mantineのモック
vi.mock('@mantine/core', () => ({
  Center: ({ children, ...props }: any) => (
    <div data-testid="center" {...props}>
      {children}
    </div>
  ),
  Stack: ({ children, ...props }: any) => (
    <div data-testid="stack" {...props}>
      {children}
    </div>
  ),
  Button: ({ children, onClick, loading, disabled, ...props }: any) => (
    <button
      data-testid="button"
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {loading ? 'ログイン中...' : children}
    </button>
  ),
  Paper: ({ children, ...props }: any) => (
    <div data-testid="paper" {...props}>
      {children}
    </div>
  ),
  Loader: ({ ...props }: any) => (
    <div data-testid="loader" {...props}>
      Loading...
    </div>
  ),
  Text: ({ children, ...props }: any) => (
    <span data-testid="text" {...props}>
      {children}
    </span>
  ),
  Image: ({ src, alt, ...props }: any) => (
    <img data-testid="image" src={src} alt={alt} {...props} />
  ),
}));

// CSSモジュールのモック
vi.mock('./Login.module.css', () => ({
  default: {
    logoCircle: 'logo-circle-class',
  },
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }}>
      {component}
    </BrowserRouter>
  );
};

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // デフォルトのモック設定
    mockUseAuth0.mockReturnValue({
      loginWithRedirect: mockLoginWithRedirect,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  it('renders login form', () => {
    renderWithRouter(<Login />);

    expect(screen.getByText('習慣化を始めましょう')).toBeInTheDocument();
    expect(screen.getByText('ログイン')).toBeInTheDocument();
  });

  it('renders logo image', () => {
    renderWithRouter(<Login />);

    expect(screen.getByAltText('Routinify Logo')).toBeInTheDocument();
  });

  it('renders help text', () => {
    renderWithRouter(<Login />);

    expect(
      screen.getByText(
        'アカウントをお持ちでない場合は、ログインボタンをクリックして新規登録できます'
      )
    ).toBeInTheDocument();
  });

  it('calls loginWithRedirect when login button is clicked', async () => {
    renderWithRouter(<Login />);

    const loginButton = screen.getByText('ログイン');
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(mockLoginWithRedirect).toHaveBeenCalledTimes(1);
    });
  });

  it('shows loading state when logging in', async () => {
    renderWithRouter(<Login />);

    const loginButton = screen.getByText('ログイン');
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText('ログイン中...')).toBeInTheDocument();
    });
  });

  it('navigates to tasks when authenticated', () => {
    // 認証済みの状態でモックを設定
    mockUseAuth0.mockReturnValue({
      loginWithRedirect: mockLoginWithRedirect,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });

    renderWithRouter(<Login />);

    expect(mockNavigate).toHaveBeenCalledWith('/tasks');
  });

  it('shows loader when Auth0 is loading', () => {
    // ローディング状態でモックを設定
    mockUseAuth0.mockReturnValue({
      loginWithRedirect: mockLoginWithRedirect,
      isAuthenticated: false,
      isLoading: true,
      error: null,
    });

    renderWithRouter(<Login />);

    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('logs error to console when Auth0 error occurs', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockError = new Error('Auth0 error');

    // エラー状態でモックを設定
    mockUseAuth0.mockReturnValue({
      loginWithRedirect: mockLoginWithRedirect,
      isAuthenticated: false,
      isLoading: false,
      error: mockError,
    });

    renderWithRouter(<Login />);

    expect(consoleSpy).toHaveBeenCalledWith('Auth0 error:', mockError);

    consoleSpy.mockRestore();
  });
});
