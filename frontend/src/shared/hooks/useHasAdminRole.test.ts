import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useHasAdminRole } from './useHasAdminRole';
import * as useAuthModule from './useAuth';

vi.mock('./useAuth');

describe('useHasAdminRole', () => {
  it('admin権限がある場合trueを返す', () => {
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      hasAccessToken: true,
      isLoading: false,
      user: { name: 'Test User', email: 'test@example.com' },
      accessToken: 'mock-token',
      userRoles: ['admin', 'user'],
      isAdmin: true,
      userPermissions: [],
      checkPermissions: vi.fn(),
      login: vi.fn(),
      logout: vi.fn(),
    });

    const { result } = renderHook(() => useHasAdminRole());
    expect(result.current).toBe(true);
  });

  it('admin権限がない場合falseを返す', () => {
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      hasAccessToken: true,
      isLoading: false,
      user: { name: 'Test User', email: 'test@example.com' },
      accessToken: 'mock-token',
      userRoles: ['user'],
      isAdmin: false,
      userPermissions: [],
      checkPermissions: vi.fn(),
      login: vi.fn(),
      logout: vi.fn(),
    });

    const { result } = renderHook(() => useHasAdminRole());
    expect(result.current).toBe(false);
  });
});
