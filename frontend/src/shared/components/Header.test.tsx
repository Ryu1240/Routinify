import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Header from './Header';
import React from 'react';

// Auth0のモック
const mockLogout = vi.fn();
vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({
    logout: mockLogout,
    isAuthenticated: true,
    user: { name: 'Test User' },
  }),
}));

// Mantineのモック
vi.mock('@mantine/core', () => ({
  Group: ({ children, ...props }: any) => (
    <div data-testid="group" {...props}>
      {children}
    </div>
  ),
  Button: ({ children, onClick, leftSection, ...props }: any) => (
    <button data-testid="button" onClick={onClick} {...props}>
      {leftSection}
      {children}
    </button>
  ),
  Text: ({ children, ...props }: any) => (
    <span data-testid="text" {...props}>
      {children}
    </span>
  ),
  Container: ({ children, ...props }: any) => (
    <div data-testid="container" {...props}>
      {children}
    </div>
  ),
  Image: ({ src, alt, ...props }: any) => (
    <img data-testid="image" src={src} alt={alt} {...props} />
  ),
  rem: (value: number) => `${value}px`,
}));

// Tabler Iconsのモック
vi.mock('@tabler/icons-react', () => ({
  IconLogout: () => <span data-testid="logout-icon">Logout Icon</span>,
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      {component}
    </BrowserRouter>
  );
};

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the header with logo and service name', () => {
    renderWithRouter(<Header />);

    expect(screen.getByText('Routinify')).toBeDefined();
    expect(screen.getByText('習慣化支援サービス')).toBeDefined();
    expect(screen.getByAltText('Routinify Logo')).toBeDefined();
  });

  it('renders logout button', () => {
    renderWithRouter(<Header />);

    expect(screen.getByText('ログアウト')).toBeDefined();
    expect(screen.getByTestId('logout-icon')).toBeDefined();
  });

  it('calls logout function when logout button is clicked', () => {
    renderWithRouter(<Header />);

    const logoutButton = screen.getByText('ログアウト');
    logoutButton.click();

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('has correct header structure', () => {
    renderWithRouter(<Header />);

    expect(screen.getByTestId('container')).toBeDefined();
    expect(screen.getAllByTestId('group')).toHaveLength(2); // 左側と右側のGroup
  });
});
