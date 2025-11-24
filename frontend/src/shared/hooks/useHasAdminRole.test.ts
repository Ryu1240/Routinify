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
      rolesLoading: false,
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
    expect(result.current.hasAdminRole).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('admin権限がない場合falseを返す', () => {
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      hasAccessToken: true,
      isLoading: false,
      rolesLoading: false,
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
    expect(result.current.hasAdminRole).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('ロール情報取得中の場合isLoadingがtrueを返す', () => {
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      hasAccessToken: true,
      isLoading: false,
      rolesLoading: true,
      user: { name: 'Test User', email: 'test@example.com' },
      accessToken: 'mock-token',
      userRoles: [],
      isAdmin: false,
      userPermissions: [],
      checkPermissions: vi.fn(),
      login: vi.fn(),
      logout: vi.fn(),
    });

    const { result } = renderHook(() => useHasAdminRole());
    expect(result.current.hasAdminRole).toBe(false);
    expect(result.current.isLoading).toBe(true);
  });

  it('ロール情報が未設定で認証ローディング中の場合isLoadingがtrueを返す', () => {
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      isAuthenticated: false,
      hasAccessToken: false,
      isLoading: true,
      rolesLoading: false,
      user: null,
      accessToken: null,
      userRoles: [],
      isAdmin: false,
      userPermissions: [],
      checkPermissions: vi.fn(),
      login: vi.fn(),
      logout: vi.fn(),
    });

    const { result } = renderHook(() => useHasAdminRole());
    expect(result.current.hasAdminRole).toBe(false);
    expect(result.current.isLoading).toBe(true);
  });
});
