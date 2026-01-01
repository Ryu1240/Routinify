# セキュリティ対策ガイド

## 実装済みのセキュリティ対策

### 1. XSS（クロスサイトスクリプティング）対策

#### Reactの自動エスケープ
- Reactは自動的にテキストコンテンツをエスケープするため、基本的なXSS攻撃から保護されています
- `dangerouslySetInnerHTML`は使用していません（監査済み）

#### Content Security Policy (CSP)
`public/index.html`にCSPヘッダーを実装:
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' data:;
  connect-src 'self' https://*.auth0.com https://*.auth0-fr.com;
  frame-src https://*.auth0.com;
  object-src 'none';
  base-uri 'self';
">
```

#### 入力バリデーション
- すべてのフォーム入力で`trim()`による空白除去
- 最大文字数制限（255文字）
- 必須フィールドの検証

### 2. Open Redirect対策

`App.tsx`のリダイレクト処理で実装:
```typescript
// 許可されたパスのホワイトリスト
const allowedPaths = ['/tasks', '/categories', '/routine-tasks', '/milestones', '/achievements', '/admin/accounts'];
const isInternalPath = returnTo.startsWith('/') && !returnTo.startsWith('//');
const isAllowedPath = allowedPaths.some(path => returnTo.startsWith(path));

if (isInternalPath && isAllowedPath) {
  navigate(returnTo);
} else {
  console.warn('Invalid redirect path blocked:', returnTo);
  navigate('/tasks');
}
```

### 3. 認証・認可セキュリティ

#### Auth0設定
- **リフレッシュトークンローテーション**: `useRefreshTokens: true`
- **フォールバック機能**: `useRefreshTokensFallback: true`
- **トークン保存**: `cacheLocation: 'localstorage'`
- **スコープ制限**: 最小権限の原則に基づいたスコープ設定

#### トークン管理
- アクセストークンの自動更新（`getAccessTokenSilently()`）
- 401エラー時の自動ログアウト
- トークン取得失敗時の再認証フロー

### 4. APIセキュリティ

#### Axios設定（`src/lib/axios.ts`）
- タイムアウト設定: 10秒
- 自動トークン付与
- エラーハンドリングとリダイレクト
- 401/500/503エラーの適切な処理

## セキュリティベストプラクティス

### コーディングガイドライン

1. **ユーザー入力の扱い**
   - 常に`trim()`で空白を除去
   - 長さ制限を実装
   - 型チェックを実施

2. **URLパラメータ**
   - 外部リダイレクトを禁止
   - ホワイトリストベースの検証

3. **認証状態**
   - `ProtectedRoute`コンポーネントでルート保護
   - 認証状態の一貫性を維持

4. **エラーハンドリング**
   - 機密情報を含まないエラーメッセージ
   - 適切なログ記録

### 今後の推奨事項

1. **DOMPurifyの導入検討**
   - ユーザー生成コンテンツが増える場合
   - リッチテキストエディタを実装する場合

2. **レート制限**
   - バックエンドAPIでのレート制限実装
   - ブルートフォース攻撃対策

3. **HTTPS強制**
   - 本番環境でHTTPSを必須化
   - HSTS（HTTP Strict Transport Security）の実装

4. **セキュリティヘッダーの追加**
   - `X-Frame-Options: DENY`
   - `X-Content-Type-Options: nosniff`
   - `Referrer-Policy: strict-origin-when-cross-origin`

## Auth0ダッシュボード推奨設定

### リフレッシュトークンローテーション
1. Auth0ダッシュボードにログイン
2. Applications → [Your App] → Settings
3. "Refresh Token Rotation"を有効化
4. "Absolute Expiration"を設定（推奨: 30日）
5. "Reuse Interval"を設定（推奨: 10秒）

### セキュリティ設定チェックリスト
- [ ] Refresh Token Rotation: 有効
- [ ] Absolute Expiration: 30日
- [ ] Inactivity Expiration: 有効
- [ ] Token Endpoint Authentication Method: Post
- [ ] OIDC Conformant: 有効
- [ ] Allowed Callback URLs: 本番URLのみ
- [ ] Allowed Logout URLs: 本番URLのみ
- [ ] Allowed Web Origins: 本番URLのみ

## インシデント対応

### セキュリティインシデント発生時の手順
1. インシデントの隔離と記録
2. 影響範囲の特定
3. トークンの無効化（必要に応じて）
4. ログの分析
5. 修正の実装とデプロイ
6. ポストモーテムの実施

## 定期セキュリティレビュー

- 四半期ごとの依存関係更新
- セキュリティスキャンの実施
- Auth0設定の見直し
- アクセスログの監査

## 参考資料

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Auth0 Security Best Practices](https://auth0.com/docs/security)
- [React Security Best Practices](https://react.dev/learn/keeping-components-pure)
- [Content Security Policy Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

