/**
 * JWTトークンをデコードしてパーミッション（スコープ）を取得するユーティリティ
 * 注意: 検証は行わず、読み取りのみを行います（検証はバックエンド側で行います）
 */

/**
 * JWTトークンのペイロード型
 */
interface JwtPayload {
  sub?: string;
  email?: string;
  scope?: string;
  [key: string]: unknown;
}

/**
 * JWTトークンをデコード（検証なし）
 * @param token JWTトークン文字列
 * @returns デコードされたペイロード、またはnull
 */
export const decodeJwtToken = (token: string): JwtPayload | null => {
  try {
    // JWTは base64url エンコードされた3つの部分で構成されている: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // ペイロード部分をデコード（base64urlデコード）
    const payload = parts[1];
    // base64urlデコード: - を + に、_ を / に変換
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    // パディングを追加（必要に応じて）
    const paddedBase64 = base64 + '==='.slice((base64.length % 4) || 0);
    // base64デコード
    const decodedPayload = atob(paddedBase64);
    return JSON.parse(decodedPayload);
  } catch (error) {
    console.error('Failed to decode JWT token:', error);
    return null;
  }
};

/**
 * JWTトークンからスコープ（パーミッション）を取得
 * @param token JWTトークン文字列
 * @returns スコープの配列、または空配列
 */
export const getPermissionsFromToken = (token: string): string[] => {
  const decoded = decodeJwtToken(token);
  if (!decoded || !decoded.scope) {
    return [];
  }

  // スコープはスペース区切りの文字列
  const scopes = typeof decoded.scope === 'string' 
    ? decoded.scope.split(' ') 
    : [];
  
  // openid, profile, email などの標準スコープを除外し、カスタムパーミッションのみを返す
  const customPermissions = scopes.filter((scope: string) => {
    const standardScopes = ['openid', 'profile', 'email', 'offline_access'];
    return !standardScopes.includes(scope);
  });

  return customPermissions;
};

/**
 * 特定のパーミッションを持っているかチェック
 * @param token JWTトークン文字列
 * @param requiredPermissions 必要なパーミッションの配列
 * @returns すべてのパーミッションを持っている場合true
 */
export const hasPermissions = (
  token: string | null,
  requiredPermissions: string[]
): boolean => {
  if (!token || requiredPermissions.length === 0) {
    return false;
  }

  const userPermissions = getPermissionsFromToken(token);
  if (userPermissions.length === 0) {
    return false;
  }

  // 必要なパーミッションがすべて含まれているかチェック
  return requiredPermissions.every((permission) =>
    userPermissions.includes(permission)
  );
};

