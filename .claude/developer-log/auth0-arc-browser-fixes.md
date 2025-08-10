# Auth0 + Arc ブラウザリダイレクト問題の解決

## 問題の概要

Arcブラウザでログイン・ログアウト時に新しいタブが開いてしまう問題と、ログアウト時に「There could be a misconfiguration in the system or a service outage」エラーが発生する問題を解決した。

## 実装した解決策

### 1. 新しいタブ問題の解決

Auth0 React SDKの`openUrl`パラメータを使用して、`window.location.replace()`によるリダイレクト制御を実装。

#### ログイン機能の修正 (`Login.tsx`)
```javascript
loginWithRedirect({
  openUrl(url) {
    // Arcブラウザで新しいタブが開くのを防ぐため、window.location.replaceを使用
    window.location.replace(url);
  }
});
```

#### ログアウト機能の修正 (`Header.tsx`)
```javascript
logout({
  logoutParams: {
    returnTo: window.location.origin
  },
  openUrl(url) {
    // Arcブラウザで新しいタブが開くのを防ぐため、window.location.replaceを使用
    window.location.replace(url);
  }
})
```

### 2. Auth0設定の改善

#### 必須audience設定
`auth0-config.ts`でREACT_APP_AUTH0_AUDIENCEを必須化し、Management APIへのフォールバックを削除。

```javascript
// Before
const audience = process.env.REACT_APP_AUTH0_AUDIENCE;
if (!audience) {
  console.warn('⚠️  REACT_APP_AUTH0_AUDIENCE が設定されていません。');
}

// After  
const audience = checkEnvironmentVariable(
  'REACT_APP_AUTH0_AUDIENCE',
  process.env.REACT_APP_AUTH0_AUDIENCE
);

// audienceフォールバックも削除
// Before: audience: audience || `https://${domain}/api/v2/`,
// After: audience,
```

### 3. Auth0ダッシュボード設定

ログアウトエラー解決のため、以下の設定が必要：
- **Allowed Logout URLs**: `http://localhost:3001` (開発環境)
- **Allowed Callback URLs**: `http://localhost:3001/tasks`

## 技術的な詳細

### openUrlパラメータの意義
- Auth0 React SDK v2の推奨実装
- デフォルトの`window.location.assign()`ではなく`window.location.replace()`を使用
- 履歴を残さずに同一タブ内でリダイレクト
- Arcブラウザの新しいタブ開く挙動を抑制

### window.location.replace() vs assign()
- `replace()`: 現在のページを置き換え、履歴に追加しない
- `assign()`: 新しいページに移動、履歴に追加する
- Arc等の現代ブラウザは`assign()`で新しいタブを開く場合がある

### Auth0設定の安全性向上
- Management APIへのフォールバックは「insufficient scope」エラーの原因
- 明示的なaudience設定により適切なスコープ管理を実現
- セキュリティ上の問題を回避

## 検証結果

- フロントエンドテスト: 84/84テストが正常にパス
- Arcブラウザ: 新しいタブが開かず同一タブ内で認証完了
- 他のブラウザ: 既存の動作を維持
- ログアウト: エラー解消、正常なリダイレクト

## 参考資料

- [Auth0 React SDK LogoutOptions](https://auth0.github.io/auth0-react/interfaces/LogoutOptions.html)
- [Auth0 React SDK RedirectLoginOptions](https://auth0.github.io/auth0-react/interfaces/RedirectLoginOptions.html)
- [Auth0 公式ドキュメント: Redirect Users after Logout](https://auth0.com/docs/authenticate/login/logout/redirect-users-after-logout)

## コミット履歴

1. `fix: require explicit Auth0 audience and remove fallback`
2. `fix: prevent Arc browser from opening new tabs during Auth0 login/logout`

## 追加の注意事項

- 環境変数REACT_APP_AUTH0_AUDIENCEが必須になったため、.envファイルでの設定が必要
- 本番環境では適切なドメインをAuth0ダッシュボードのAllowed Logout URLsに設定
- この修正はAuth0公式ドキュメントの推奨実装に準拠している