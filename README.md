# Routinify

習慣化を支援するタスク管理システム

## セットアップ

### 1. 環境変数の設定

Auth0の設定を行うために、環境変数を設定する必要があります。

```bash
# 環境変数設定スクリプトを実行
chmod +x setup-env.sh
./setup-env.sh
```

または、手動で`frontend/.env`ファイルを作成：

```bash
# frontend/.env
REACT_APP_AUTH0_DOMAIN=dev-x7dol3ce1bkdedsn.jp.auth0.com
REACT_APP_AUTH0_CLIENT_ID=your-client-id
REACT_APP_AUTH0_AUDIENCE=https://Routinify-auth-api.com
REACT_APP_API_URL=http://localhost:3000
```

### 2. アプリケーションの起動

```bash
make up
```

### 3. アクセス

- フロントエンド: http://localhost:3001
- バックエンドAPI: http://localhost:3000
- Swagger UI: http://localhost:8080

## 開発

### コマンド一覧

```bash
make help  # 利用可能なコマンドを表示
make up    # アプリケーションを起動
make down  # アプリケーションを停止
make logs  # ログを表示
```

### コード品質管理

#### バックエンド（Ruby/Rails）
```bash
make lint-backend        # RuboCopでコードチェック
make lint-backend-fix    # RuboCopで自動修正
make lint-backend-check  # RuboCopでチェック（詳細出力）
```

#### フロントエンド（React/TypeScript）
```bash
make lint-frontend        # Prettierでコードチェック
make lint-frontend-fix    # Prettierで自動修正
make lint-frontend-check  # Prettierでチェック（詳細出力）
```

#### 全体的なフォーマット
```bash
make format-all  # バックエンドとフロントエンドの両方を自動修正
```

### 環境変数

- `REACT_APP_AUTH0_DOMAIN`: Auth0のドメイン
- `REACT_APP_AUTH0_CLIENT_ID`: Auth0のクライアントID
- `REACT_APP_AUTH0_AUDIENCE`: Auth0のオーディエンス
- `REACT_APP_API_URL`: バックエンドAPIのURL

**注意**: `.env`ファイルはGitにコミットされません。機密情報を含むため、各自で設定してください。

## トラブルシューティング

### Arcブラウザでの問題

Arcブラウザでログイン時に新しいウィンドウが開く場合：

1. **ポップアップブロッカーの設定**
   - Arcの設定 → プライバシーとセキュリティ → サイトの設定
   - `localhost:3001`を許可リストに追加

2. **サードパーティCookieの設定**
   - Arcの設定 → プライバシーとセキュリティ → Cookie
   - `localhost:3001`でサードパーティCookieを許可

3. **推奨ブラウザ**
   - Chrome、Firefox、Safariでの動作を推奨
   - Arcでの問題が続く場合は、他のブラウザでテストしてください
