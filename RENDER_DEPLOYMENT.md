# Render デプロイメントガイド

このガイドでは、RoutinifyアプリケーションをRenderにデプロイする手順を説明します。

## 📋 目次

1. [前提条件](#前提条件)
2. [Renderアカウントのセットアップ](#renderアカウントのセットアップ)
3. [データベースサービスの作成](#データベースサービスの作成)
4. [Redisサービスの作成](#redisサービスの作成)
5. [バックエンドサービスのデプロイ](#バックエンドサービスのデプロイ)
6. [フロントエンドサービスのデプロイ](#フロントエンドサービスのデプロイ)
7. [環境変数の設定](#環境変数の設定)
8. [データベースマイグレーション](#データベースマイグレーション)
9. [トラブルシューティング](#トラブルシューティング)

---

## 前提条件

- Renderアカウント（[https://render.com](https://render.com)）
- GitHubリポジトリへのアクセス権限
- Auth0アカウントと設定済みのアプリケーション
- `RAILS_MASTER_KEY`（`backend/config/master.key`から取得）

---

## Renderアカウントのセットアップ

1. [Render](https://render.com)にアクセスしてアカウントを作成
2. GitHubアカウントを連携
3. リポジトリを接続

---

## 方法1: render.yamlを使用した自動デプロイ（推奨）

### 手順

1. **render.yamlファイルの確認**
   - プロジェクトルートの`render.yaml`を確認
   - 必要に応じて環境変数を調整

2. **Render Dashboardで新規Blueprintを作成**
   - Render Dashboard → "New" → "Blueprint"
   - GitHubリポジトリを選択
   - `render.yaml`が自動的に検出されます

3. **環境変数の設定**
   - Blueprint作成後、各サービスで環境変数を設定（後述の「環境変数の設定」セクションを参照）

4. **デプロイの開始**
   - "Apply"をクリックしてデプロイを開始

---

## 方法2: 手動でサービスを作成

### 1. データベースサービスの作成

1. Render Dashboard → "New" → "PostgreSQL"
2. 以下の設定を入力：
   - **Name**: `routinify-db`
   - **Database Name**: `routinify_production`
   - **User**: `routinify_user`
   - **Plan**: Starter（無料プラン）または必要に応じてアップグレード
3. "Create Database"をクリック
4. 接続情報をメモ（後で使用します）

### 2. Redisサービスの作成

1. Render Dashboard → "New" → "Redis"
2. 以下の設定を入力：
   - **Name**: `routinify-redis`
   - **Plan**: Starter（無料プラン）または必要に応じてアップグレード
3. "Create Redis"をクリック
4. 接続情報をメモ（後で使用します）

### 3. バックエンドサービスのデプロイ

1. Render Dashboard → "New" → "Web Service"
2. GitHubリポジトリを接続
3. 以下の設定を入力：
   - **Name**: `routinify-backend`
   - **Region**: 最寄りのリージョンを選択
   - **Branch**: `main`（またはデプロイしたいブランチ）
   - **Root Directory**: `backend`
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `Dockerfile`
   - **Docker Context**: `.`（backendディレクトリがルート）
   - **Build Command**: `bundle install && bundle exec rails assets:precompile`
   - **Start Command**: `bundle exec ridgepole --config ./config/database.yml --file ./db/Schemafile --apply && bundle exec rails server -p $PORT -b 0.0.0.0`
   - **Plan**: Starter（無料プラン）または必要に応じてアップグレード

4. **環境変数の設定**（後述のセクションを参照）

5. "Create Web Service"をクリック

### 4. フロントエンドサービスのデプロイ

#### オプションA: 静的サイトとして（推奨）

1. Render Dashboard → "New" → "Static Site"
2. GitHubリポジトリを接続
3. 以下の設定を入力：
   - **Name**: `routinify-frontend`
   - **Branch**: `main`（またはデプロイしたいブランチ）
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install -g pnpm && pnpm install && pnpm run build`
   - **Publish Directory**: `build`
   - **Plan**: Starter（無料プラン）

4. **環境変数の設定**（後述のセクションを参照）

5. "Create Static Site"をクリック

#### オプションB: Webサービスとして（Node.js）

1. Render Dashboard → "New" → "Web Service"
2. GitHubリポジトリを接続
3. 以下の設定を入力：
   - **Name**: `routinify-frontend`
   - **Root Directory**: `frontend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install -g pnpm && pnpm install && pnpm run build`
   - **Start Command**: `npx serve -s build -l $PORT`
   - **Plan**: Starter（無料プラン）

4. **環境変数の設定**（後述のセクションを参照）

5. "Create Web Service"をクリック

---

## 環境変数の設定

### render.yamlでの環境変数の扱い

`render.yaml`では、環境変数の設定方法が3つあります：

1. **`value:` が設定されているもの** → `render.yaml`に直接記入（非機密情報）
   - 例: `RAILS_ENV`, `RAILS_MAX_THREADS`, `RAILS_LOG_LEVEL`

2. **`sync: false` が設定されているもの** → Render Dashboardで手動設定が必要（機密情報）
   - 例: `RAILS_MASTER_KEY`, `AUTH0_DOMAIN`, `AUTH0_CLIENT_SECRET`など
   - **セキュリティ上の理由で、機密情報は`render.yaml`に直接記入しないことを推奨**

3. **`fromDatabase:` / `fromService:` が設定されているもの** → 他のサービスから自動設定
   - 例: `DATABASE_URL`, `REDIS_URL`, `REACT_APP_API_URL`

### オプション1: render.yamlに直接記入する場合

機密情報を`render.yaml`に直接記入したい場合は、`sync: false`を削除して`value:`を追加します：

```yaml
envVars:
  - key: AUTH0_DOMAIN
    value: your-tenant.auth0.com  # 直接記入
  - key: AUTH0_CLIENT_SECRET
    value: your-secret-here  # 直接記入（非推奨）
```

**⚠️ 注意**: 
- 機密情報を`render.yaml`に記入すると、Gitリポジトリにコミットされるため、セキュリティリスクがあります
- チーム開発や公開リポジトリでは**絶対に避けてください**

### オプション2: Render Dashboardで手動設定（推奨）

現在の`render.yaml`の設定（`sync: false`）では、以下の手順で環境変数を設定します：

### バックエンドサービスの環境変数

Render Dashboardでバックエンドサービスを開き、"Environment"タブで以下を設定：

#### データベース関連（自動設定 - render.yamlで設定済み）
- `DATABASE_URL`: ✅ 自動設定（`fromDatabase`で設定）
- `DATABASE_HOST`: ✅ 自動設定（`fromDatabase`で設定）
- `DATABASE_USERNAME`: ✅ 自動設定（`fromDatabase`で設定）
- `DATABASE_PASSWORD`: ✅ 自動設定（`fromDatabase`で設定）

#### Redis関連（自動設定 - render.yamlで設定済み）
- `REDIS_URL`: ✅ 自動設定（`fromService`で設定）

#### Rails関連
- `RAILS_ENV`: ✅ `render.yaml`に直接記入済み（`value: production`）
- `RAILS_MASTER_KEY`: ⚠️ **手動設定が必要** - `backend/config/master.key`の内容をコピー
- `RAILS_MAX_THREADS`: ✅ `render.yaml`に直接記入済み（`value: 5`）
- `RAILS_LOG_LEVEL`: ✅ `render.yaml`に直接記入済み（`value: info`）
- `PORT`: ✅ Renderが自動設定（明示的な設定不要）

#### Auth0関連（すべて手動設定が必要）
- `AUTH0_DOMAIN`: ⚠️ **手動設定が必要** - Auth0ドメイン（例: `your-tenant.auth0.com`）
- `AUTH0_AUDIENCE`: ⚠️ **手動設定が必要** - Auth0 API Audience
- `AUTH0_MANAGEMENT_API_CLIENT_ID`: ⚠️ **手動設定が必要** - Auth0 Management API Client ID
- `AUTH0_MANAGEMENT_API_CLIENT_SECRET`: ⚠️ **手動設定が必要** - Auth0 Management API Client Secret
- `AUTH0_CLIENT_ID`: ⚠️ **手動設定が必要** - Auth0 Application Client ID
- `AUTH0_CLIENT_SECRET`: ⚠️ **手動設定が必要** - Auth0 Application Client Secret

### フロントエンドサービスの環境変数

Render Dashboardでフロントエンドサービスを開き、"Environment"タブで以下を設定：

#### Auth0関連（すべて手動設定が必要）
- `REACT_APP_AUTH0_DOMAIN`: ⚠️ **手動設定が必要** - Auth0ドメイン（例: `your-tenant.auth0.com`）
- `REACT_APP_AUTH0_CLIENT_ID`: ⚠️ **手動設定が必要** - Auth0 Application Client ID
- `REACT_APP_AUTH0_AUDIENCE`: ⚠️ **手動設定が必要** - Auth0 API Audience

#### API URL（自動設定 - render.yamlで設定済み）
- `REACT_APP_API_URL`: ✅ 自動設定（`fromService`でバックエンドのURLを取得）

**注意**: 静的サイトの場合、環境変数はビルド時に使用されます。変更後は再デプロイが必要です。

### 環境変数の設定手順（Render Dashboard）

1. Render Dashboardにログイン
2. 対象のサービス（バックエンドまたはフロントエンド）を選択
3. 左側メニューから「Environment」を選択
4. 「Add Environment Variable」をクリック
5. キーと値を入力して保存
6. 変更後、サービスを再デプロイ（静的サイトの場合は自動的に再ビルドされます）

---

## データベースマイグレーション

### 初回デプロイ時

バックエンドサービスのStart Commandに`bundle exec ridgepole --config ./config/database.yml --file ./db/Schemafile --apply`が含まれているため、初回デプロイ時に自動的に実行されます。

**注意**: このプロジェクトはRidgepoleを使用してスキーマ管理を行っているため、Rails標準の`rails db:migrate`は使用しません。

### 手動でスキーマを適用する場合

1. Render Dashboardでバックエンドサービスを開く
2. "Shell"タブを開く
3. 以下のコマンドを実行：

```bash
# ドライランで変更内容を確認（推奨）
bundle exec ridgepole --config ./config/database.yml --file ./db/Schemafile --apply --dry-run

# 問題なければ適用
bundle exec ridgepole --config ./config/database.yml --file ./db/Schemafile --apply
```

### 注意事項

- **Ridgepoleを使用**: このプロジェクトはRails標準のマイグレーションではなく、Ridgepoleを使用します
- **ドライラン推奨**: 本番環境での変更前は必ず`--dry-run`で確認してください
- **データ損失に注意**: スキーマ変更は慎重に行ってください

### シードデータの投入

```bash
bundle exec rails db:seed
```

---

## トラブルシューティング

### バックエンドが起動しない

1. **ログを確認**
   - Render Dashboard → バックエンドサービス → "Logs"タブ
   - エラーメッセージを確認

2. **環境変数の確認**
   - すべての必須環境変数が設定されているか確認
   - `RAILS_MASTER_KEY`が正しく設定されているか確認

3. **データベース接続の確認**
   - `DATABASE_URL`または個別の接続情報が正しいか確認
   - PostgreSQLサービスが起動しているか確認

### フロントエンドがビルドに失敗する

1. **ビルドログを確認**
   - Render Dashboard → フロントエンドサービス → "Logs"タブ

2. **環境変数の確認**
   - すべての`REACT_APP_*`環境変数が設定されているか確認
   - 環境変数はビルド時に必要です

3. **Node.jsバージョンの確認**
   - `frontend/package.json`に`engines`フィールドを追加：
   ```json
   "engines": {
     "node": ">=20.0.0",
     "pnpm": ">=8.0.0"
   }
   ```

### CORSエラー

バックエンドのCORS設定を確認：

```ruby
# backend/config/initializers/cors.rb
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins 'https://routinify-frontend.onrender.com' # フロントエンドのURL
    resource '*',
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      credentials: true
  end
end
```

### データベース接続エラー

1. PostgreSQLサービスのステータスを確認
2. 接続情報（ホスト、ポート、ユーザー名、パスワード）を確認
3. データベース名が正しいか確認

### Redis接続エラー

1. Redisサービスのステータスを確認
2. `REDIS_URL`が正しく設定されているか確認
3. Redisが必須でない場合は、一時的に無効化してテスト

---

## カスタムドメインの設定

1. Render Dashboard → サービス → "Settings" → "Custom Domains"
2. ドメインを追加
3. DNS設定を更新（Renderが提供する指示に従う）

---

## 継続的デプロイ（CD）

RenderはデフォルトでGitHubへのプッシュ時に自動デプロイを行います。

- 特定のブランチのみデプロイする場合は、サービス設定でブランチを指定
- 手動デプロイに切り替える場合は、"Auto-Deploy"を無効化

---

## パフォーマンス最適化

### バックエンド

- **Planのアップグレード**: より多くのリソースが必要な場合
- **Worker数の調整**: `WEB_CONCURRENCY`環境変数で調整
- **データベース接続プール**: `RAILS_MAX_THREADS`で調整

### フロントエンド

- **静的アセットの最適化**: ビルド時に自動的に最適化されます
- **CDNの使用**: Renderの静的サイトは自動的にCDNを使用

---

## セキュリティチェックリスト

- [ ] すべての環境変数が適切に設定されている
- [ ] `RAILS_MASTER_KEY`が漏洩していない
- [ ] Auth0のシークレットが適切に管理されている
- [ ] CORS設定が適切に制限されている
- [ ] データベース接続がSSL経由であることを確認
- [ ] 本番環境でデバッグモードが無効になっている

---

## 参考リンク

- [Render公式ドキュメント](https://render.com/docs)
- [Rails on Render](https://render.com/docs/deploy-rails)
- [React on Render](https://render.com/docs/deploy-create-react-app)

---

## サポート

問題が発生した場合は、以下を確認してください：

1. Render Dashboardのログ
2. 環境変数の設定
3. サービスのステータス
4. [Renderコミュニティフォーラム](https://community.render.com/)

