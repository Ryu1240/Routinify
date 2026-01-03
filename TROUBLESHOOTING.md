# トラブルシューティングガイド

## Dockerネットワークエラーの解決方法

### 1. Dockerコンテナの状態を確認

```bash
docker-compose ps
```

すべてのコンテナが`Up`状態であることを確認してください。

### 2. バックエンドのログを確認

```bash
docker-compose logs backend
```

エラーメッセージを確認し、以下の問題がないか確認してください：
- データベース接続エラー
- マイグレーション未実行
- ポート競合

### 3. データベースのマイグレーションを実行

```bash
docker-compose exec backend bundle exec rails db:migrate
```

### 4. コンテナの再起動

```bash
# すべてのコンテナを停止
docker-compose down

# コンテナを再起動
docker-compose up -d

# ログを確認
docker-compose logs -f backend
```

### 5. ネットワークの確認

```bash
# Dockerネットワークを確認
docker network ls

# ネットワークの詳細を確認
docker network inspect routinify_routinify-network
```

### 6. バックエンドのヘルスチェック

ブラウザまたはcurlで以下にアクセスして、バックエンドが起動しているか確認：

```bash
curl http://localhost:3000/up
```

正常な場合は`200 OK`が返ります。

### 7. フロントエンドからバックエンドへの接続確認

ブラウザの開発者ツールのNetworkタブで、リクエストの詳細を確認：
- リクエストURLが正しいか（`http://localhost:3000/api/v1/...`）
- ステータスコード（404、500など）
- レスポンスボディにエラーメッセージが含まれているか

### 8. よくある問題と解決方法

#### 404エラーが発生する場合

- バックエンドが起動していない可能性があります
  ```bash
  docker-compose logs backend
  ```
  でエラーを確認してください

- ルーティングの問題
  ```bash
  docker-compose exec backend bundle exec rails routes | grep api
  ```
  でルーティングを確認してください

#### 500エラーが発生する場合

- データベース接続の問題
  ```bash
  docker-compose exec backend bundle exec rails db:migrate:status
  ```
  でマイグレーション状態を確認してください

- データベースの作成
  ```bash
  docker-compose exec backend bundle exec rails db:create
  docker-compose exec backend bundle exec rails db:migrate
  ```

#### Content Security Policy (CSP) エラー

**エラーメッセージ:**
```
Connecting to '<URL>' violates the following Content Security Policy directive: "connect-src 'self' <URL> <URL>". The action has been blocked.
```

**原因:**
- CSPの`connect-src`ディレクティブが、APIリクエスト先のURLを許可していない
- 開発環境では`http://localhost:3000`への接続が許可されていない
- 本番環境では本番APIのURLが許可されていない

**解決方法:**

1. **`frontend/public/index.html`のCSP設定を確認**
   - `connect-src`に必要なURLが含まれているか確認
   - 開発環境: `http://localhost:3000`が含まれているか
   - 本番環境: 本番APIのURLが含まれているか

2. **CSP設定の更新（既に修正済み）**
   ```html
   connect-src 'self' http://localhost:3000 http://localhost:3001 https://*.auth0.com https://*.auth0-fr.com https://routinify-backend.onrender.com;
   ```

3. **フロントエンドコンテナの再起動**
   ```bash
   docker-compose restart frontend
   ```

4. **ブラウザのキャッシュをクリア**
   - ブラウザの開発者ツールで「Disable cache」を有効にする
   - または、シークレットモードでアクセス

#### ERR_CONTENT_LENGTH_MISMATCHエラー

これはDocker環境でReact開発サーバー（webpack-dev-server）を使用している場合によく発生する問題です。

**原因:**
- Dockerボリュームマウントとwebpack-dev-serverのファイル監視の不整合
- ファイルが変更中にリクエストされた
- Content-Lengthヘッダーと実際のファイルサイズが一致しない
- webpack-dev-serverの圧縮機能が原因でContent-Lengthが正しく計算されない

**解決方法:**

1. **画像をimportする方法（推奨・既に実装済み）**
   - 画像を`frontend/src/assets/images/`に配置し、コンポーネントでimportする
   - これにより、webpackが画像をバンドルに含め、Content-Lengthの問題を完全に回避できます
   - `Header.tsx`と`Login.tsx`で既に実装済み
   - 例：
     ```typescript
     import routinifyLogo from '@/assets/images/Routinify-Logo.png';
     <Image src={routinifyLogo} alt="Routinify Logo" />
     ```

2. **webpack-dev-serverの設定（既に設定済み）**
   - `frontend/craco.config.js`に静的ファイルの監視設定を追加
   - Docker環境でのファイル監視を改善

3. **環境変数の設定（既に設定済み）**
   - `CHOKIDAR_USEPOLLING=true` が `docker-compose.yml` と `package.json` に設定されています
   - これにより、Docker環境でのファイル監視が改善されます

4. **フロントエンドコンテナの再起動**
   ```bash
   docker-compose restart frontend
   ```

5. **完全な再起動（問題が続く場合）**
   ```bash
   docker-compose down
   docker-compose up -d
   ```

6. **ブラウザのキャッシュをクリア**
   - ブラウザの開発者ツールで「Disable cache」を有効にする
   - または、シークレットモードでアクセス

7. **画像ファイルの確認**
   ```bash
   ls -lh frontend/src/assets/images/Routinify-Logo.png
   ```
   ファイルが存在し、サイズが正常であることを確認してください

### 9. 完全なリセット（最終手段）

```bash
# すべてのコンテナとボリュームを削除
docker-compose down -v

# イメージを再ビルド
docker-compose build --no-cache

# コンテナを起動
docker-compose up -d

# データベースをセットアップ
docker-compose exec backend bundle exec rails db:create
docker-compose exec backend bundle exec rails db:migrate
```

