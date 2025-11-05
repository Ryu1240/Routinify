/**
 * Auth0 Action: Post Login
 * ロールを持っていないユーザーに自動的に"user"ロールを付与する
 * 
 * 【推奨】Auth0の公式ドキュメントでは、Post User Registrationではなく
 * Post Loginアクションを使用してロールを付与することを推奨しています。
 * これにより、ユーザーが確実に存在する状態でロールを付与できます。
 * 
 * 動作:
 * - ログイン時に、ユーザーが既にロールを持っているか確認
 * - ロールを持っていない場合のみ、"user"ロールを付与
 * - 既にロールを持っている場合はスキップ
 * 
 * セットアップ手順:
 * 1. Auth0ダッシュボード > Actions > Library で「+ Create Action」をクリック
 * 2. 「Build Custom」を選択
 * 3. 以下の情報を入力:
 *    - Name: "Assign User Role on First Login"
 *    - Trigger: "Post Login"
 * 4. 以下のコードをコピー＆ペースト
 * 5. 「Deploy」をクリック
 * 6. Auth0ダッシュボード > Actions > Flows で「Login」フローを開く
 * 7. 作成したアクションをドラッグ＆ドロップで追加
 * 8. 「Apply」をクリック
 * 
 * 必要な設定:
 * - Management APIのM2Mアプリケーションが必要
 * - M2Mアプリケーションに以下のスコープが必要:
 *   - read:roles
 *   - read:users
 *   - update:users
 * - M2MアプリケーションのClient IDとClient Secretを環境変数に設定
 */

exports.onExecutePostLogin = async function(event, api) {
  const MANAGEMENT_API_DOMAIN = event.secrets.AUTH0_DOMAIN;
  const CLIENT_ID = event.secrets.AUTH0_MANAGEMENT_API_CLIENT_ID;
  const CLIENT_SECRET = event.secrets.AUTH0_MANAGEMENT_API_CLIENT_SECRET;
  const DEFAULT_ROLE_NAME = 'user';

  // 環境変数のチェック
  if (!MANAGEMENT_API_DOMAIN || !CLIENT_ID || !CLIENT_SECRET) {
    console.error('❌ 必要な環境変数が設定されていません');
    console.error('AUTH0_DOMAIN, AUTH0_MANAGEMENT_API_CLIENT_ID, AUTH0_MANAGEMENT_API_CLIENT_SECRETを設定してください');
    return;
  }

  const userId = event.user.user_id;
  const loginCount = event.stats?.logins_count || 0;

  console.log(`📝 ログイン処理開始: ${userId} (ログイン回数: ${loginCount})`);

  try {
    // 1. Management APIのアクセストークンを取得
    const managementToken = await getManagementToken(MANAGEMENT_API_DOMAIN, CLIENT_ID, CLIENT_SECRET);
    console.log('✅ Management APIトークンを取得しました');

    // 2. ユーザーが既にロールを持っているか確認
    const encodedUserId = encodeURIComponent(userId);
    const userRolesResponse = await fetch(`https://${MANAGEMENT_API_DOMAIN}/api/v2/users/${encodedUserId}/roles`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${managementToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (userRolesResponse.ok) {
      const userRoles = await userRolesResponse.json();
      if (userRoles.length > 0) {
        console.log(`✅ ユーザーは既にロールを持っています: ${userRoles.map(r => r.name).join(', ')}`);
        console.log(`📝 ロール付与をスキップします`);
        return;
      }
      console.log(`📝 ユーザーはロールを持っていません。ロールを付与します。`);
    } else {
      console.log(`⚠️ ユーザーロールの取得に失敗しましたが、ロール付与を続行します`);
    }

    // 3. ロールIDを取得
    const rolesResponse = await fetch(`https://${MANAGEMENT_API_DOMAIN}/api/v2/roles`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${managementToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!rolesResponse.ok) {
      const errorData = await rolesResponse.json().catch(() => ({}));
      throw new Error(`ロール取得失敗: ${rolesResponse.status} - ${errorData.error_description || errorData.error || rolesResponse.statusText}`);
    }

    const roles = await rolesResponse.json();
    const userRole = roles.find(role => role.name === DEFAULT_ROLE_NAME);

    if (!userRole) {
      console.error(`❌ ロール "${DEFAULT_ROLE_NAME}" が見つかりません`);
      console.error('Auth0ダッシュボードでロールを作成してください');
      return;
    }

    const roleId = userRole.id;
    console.log(`✅ ロール "${DEFAULT_ROLE_NAME}" のIDを取得しました: ${roleId}`);

    // 4. ユーザーにロールを付与
    // Post Loginでは、ユーザーは確実に存在するため、リトライは不要
    const assignUrl = `https://${MANAGEMENT_API_DOMAIN}/api/v2/users/${encodedUserId}/roles`;

    console.log(`🔍 ロール付与API呼び出し:`, {
      url: assignUrl,
      userId: userId,
      encodedUserId: encodedUserId,
      roleId: roleId,
    });

    const assignResponse = await fetch(assignUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${managementToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roles: [roleId],
      }),
    });

    if (!assignResponse.ok) {
      const errorText = await assignResponse.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }

      console.error(`❌ ロール付与APIエラー詳細:`, {
        status: assignResponse.status,
        statusText: assignResponse.statusText,
        error: errorData,
        url: assignUrl,
        userId: userId,
        encodedUserId: encodedUserId,
      });

      throw new Error(`ロール付与失敗: ${assignResponse.status} - ${errorData.message || errorData.error_description || errorData.error || assignResponse.statusText}`);
    }

    console.log(`✅ ユーザー ${userId} にロール "${DEFAULT_ROLE_NAME}" を付与しました`);
  } catch (error) {
    console.error('❌ ロール付与処理でエラーが発生しました:', error.message);
    // エラーが発生しても、ログイン処理は続行される
    // バックエンドの初回ログイン時のフォールバック処理に頼る
  }
};

/**
 * Management APIのアクセストークンを取得
 */
async function getManagementToken(domain, clientId, clientSecret) {
  const tokenResponse = await fetch(`https://${domain}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      audience: `https://${domain}/api/v2/`,
      grant_type: 'client_credentials',
    }),
  });

  if (!tokenResponse.ok) {
    const errorData = await tokenResponse.json().catch(() => ({}));
    throw new Error(`Management API token取得失敗: ${tokenResponse.status} - ${errorData.error_description || errorData.error || tokenResponse.statusText}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

