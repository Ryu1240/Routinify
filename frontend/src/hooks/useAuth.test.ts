import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useAuth } from './useAuth'

// Auth0のモック
const mockUseAuth0 = vi.fn()
vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => mockUseAuth0(),
}))

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns authentication state when user is authenticated', async () => {
    mockUseAuth0.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { name: 'Test User', email: 'test@example.com' },
      getAccessTokenSilently: vi.fn().mockResolvedValue('mock-token'),
      loginWithRedirect: vi.fn(),
      logout: vi.fn(),
    })

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.user).toEqual({ name: 'Test User', email: 'test@example.com' })
    })
  })

  it('returns authentication state when user is not authenticated', () => {
    mockUseAuth0.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: undefined,
      getAccessTokenSilently: vi.fn().mockResolvedValue(null),
      loginWithRedirect: vi.fn(),
      logout: vi.fn(),
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.user).toBeUndefined()
  })

  it('returns loading state when Auth0 is loading', () => {
    mockUseAuth0.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null,
      getAccessTokenSilently: vi.fn().mockResolvedValue(null),
      loginWithRedirect: vi.fn(),
      logout: vi.fn(),
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.isLoading).toBe(true)
  })

  it('provides access token when authenticated', async () => {
    const mockGetAccessToken = vi.fn().mockResolvedValue('mock-access-token')
    
    mockUseAuth0.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { name: 'Test User' },
      getAccessTokenSilently: mockGetAccessToken,
      loginWithRedirect: vi.fn(),
      logout: vi.fn(),
    })

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.accessToken).toBe('mock-access-token')
    })
  })

  it('handles access token error gracefully', async () => {
    const mockGetAccessToken = vi.fn().mockRejectedValue(new Error('Token error'))
    const mockLogout = vi.fn()
    
    mockUseAuth0.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { name: 'Test User' },
      getAccessTokenSilently: mockGetAccessToken,
      loginWithRedirect: vi.fn(),
      logout: mockLogout,
    })

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.accessToken).toBeNull()
    })
  })
}) 