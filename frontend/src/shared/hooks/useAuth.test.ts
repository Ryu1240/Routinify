import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from './useAuth';
import { authApi } from '@/features/auth/api/authApi';

// Auth0のモック
const mockUseAuth0 = vi.fn();
vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => mockUseAuth0(),
}));

// authApiのモック
vi.mock('@/features/auth/api/authApi', () => ({
  authApi: {
    login: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}));

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns authentication state when user is authenticated', async () => {
    mockUseAuth0.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { name: 'Test User', email: 'test@example.com' },
      getAccessTokenSilently: vi.fn().mockResolvedValue('mock-token'),
      loginWithRedirect: vi.fn(),
      logout: vi.fn(),
    });

    vi.mocked(authApi.login).mockResolvedValue({
      user: {
        id: 'auth0|user123',
        email: 'test@example.com',
        roles: ['user'],
      },
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.user).toEqual({
        name: 'Test User',
        email: 'test@example.com',
      });
    });
  });

  it('returns authentication state when user is not authenticated', () => {
    mockUseAuth0.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: undefined,
      getAccessTokenSilently: vi.fn().mockResolvedValue(null),
      loginWithRedirect: vi.fn(),
      logout: vi.fn(),
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.user).toBeUndefined();
  });

  it('returns loading state when Auth0 is loading', () => {
    mockUseAuth0.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null,
      getAccessTokenSilently: vi.fn().mockResolvedValue(null),
      loginWithRedirect: vi.fn(),
      logout: vi.fn(),
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(true);
  });

  it('provides access token when authenticated', async () => {
    const mockGetAccessToken = vi.fn().mockResolvedValue('mock-access-token');

    mockUseAuth0.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { name: 'Test User' },
      getAccessTokenSilently: mockGetAccessToken,
      loginWithRedirect: vi.fn(),
      logout: vi.fn(),
    });

    vi.mocked(authApi.login).mockResolvedValue({
      user: {
        id: 'auth0|user123',
        email: 'test@example.com',
        roles: ['admin'],
      },
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.accessToken).toBe('mock-access-token');
      expect(result.current.hasAccessToken).toBe(true);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  it('isAuthenticated reflects Auth0 state even when token is not available', () => {
    mockUseAuth0.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { name: 'Test User' },
      getAccessTokenSilently: vi.fn().mockResolvedValue(null),
      loginWithRedirect: vi.fn(),
      logout: vi.fn(),
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.hasAccessToken).toBe(false);
  });

  it('fetches user roles when authenticated', async () => {
    const mockGetAccessToken = vi.fn().mockResolvedValue('mock-access-token');

    mockUseAuth0.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { name: 'Test User', email: 'test@example.com' },
      getAccessTokenSilently: mockGetAccessToken,
      loginWithRedirect: vi.fn(),
      logout: vi.fn(),
    });

    vi.mocked(authApi.login).mockResolvedValue({
      user: {
        id: 'auth0|user123',
        email: 'test@example.com',
        roles: ['admin', 'user'],
      },
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.userRoles).toEqual(['admin', 'user']);
      expect(result.current.isAdmin).toBe(true);
    });
  });

  it('sets isAdmin to true when user has admin role', async () => {
    const mockGetAccessToken = vi.fn().mockResolvedValue('mock-access-token');

    mockUseAuth0.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { name: 'Test User' },
      getAccessTokenSilently: mockGetAccessToken,
      loginWithRedirect: vi.fn(),
      logout: vi.fn(),
    });

    vi.mocked(authApi.login).mockResolvedValue({
      user: {
        id: 'auth0|user123',
        email: 'test@example.com',
        roles: ['admin'],
      },
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isAdmin).toBe(true);
    });
  });

  it('sets isAdmin to false when user does not have admin role', async () => {
    const mockGetAccessToken = vi.fn().mockResolvedValue('mock-access-token');

    mockUseAuth0.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { name: 'Test User' },
      getAccessTokenSilently: mockGetAccessToken,
      loginWithRedirect: vi.fn(),
      logout: vi.fn(),
    });

    vi.mocked(authApi.login).mockResolvedValue({
      user: {
        id: 'auth0|user123',
        email: 'test@example.com',
        roles: ['user'],
      },
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isAdmin).toBe(false);
    });
  });

  it('handles access token error gracefully', async () => {
    const mockGetAccessToken = vi
      .fn()
      .mockRejectedValue(new Error('Token error'));
    const mockLogout = vi.fn();

    mockUseAuth0.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { name: 'Test User' },
      getAccessTokenSilently: mockGetAccessToken,
      loginWithRedirect: vi.fn(),
      logout: mockLogout,
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.accessToken).toBeNull();
      expect(result.current.hasAccessToken).toBe(false);
      // isAuthenticated should still reflect Auth0 state even if token fetch fails
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  it('calls logout API when logout is called', async () => {
    const mockGetAccessToken = vi.fn().mockResolvedValue('mock-access-token');
    const mockAuth0Logout = vi.fn().mockResolvedValue(undefined);

    mockUseAuth0.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { name: 'Test User' },
      getAccessTokenSilently: mockGetAccessToken,
      loginWithRedirect: vi.fn(),
      logout: mockAuth0Logout,
    });

    vi.mocked(authApi.login).mockResolvedValue({
      user: {
        id: 'auth0|user123',
        email: 'test@example.com',
        roles: ['admin'],
      },
    });

    vi.mocked(authApi.logout).mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.accessToken).toBe('mock-access-token');
    });

    await result.current.logout();

    expect(authApi.logout).toHaveBeenCalled();
    expect(mockAuth0Logout).toHaveBeenCalled();
  });

  it('handles logout API error gracefully', async () => {
    const mockGetAccessToken = vi.fn().mockResolvedValue('mock-access-token');
    const mockAuth0Logout = vi.fn().mockResolvedValue(undefined);

    mockUseAuth0.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { name: 'Test User' },
      getAccessTokenSilently: mockGetAccessToken,
      loginWithRedirect: vi.fn(),
      logout: mockAuth0Logout,
    });

    vi.mocked(authApi.login).mockResolvedValue({
      user: {
        id: 'auth0|user123',
        email: 'test@example.com',
        roles: ['admin'],
      },
    });

    vi.mocked(authApi.logout).mockRejectedValue(new Error('Logout error'));

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.accessToken).toBe('mock-access-token');
    });

    await result.current.logout();

    expect(authApi.logout).toHaveBeenCalled();
    expect(mockAuth0Logout).toHaveBeenCalled();
  });
});
