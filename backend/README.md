# Routinify Backend

Routinify Backendは、タスク管理アプリケーション「Routinify」のAPIサーバーです。
Rails 8.0をベースとしたRESTful APIを提供し、認証・認可、タスク管理、カテゴリ管理などの機能を実装しています。

## 📋 目次

- [概要](#概要)
- [技術スタック](#技術スタック)
- [セットアップ](#セットアップ)
- [開発](#開発)
- [テスト](#テスト)
- [デプロイ](#デプロイ)
- [ドキュメント](#ドキュメント)
- [コントリビューション](#コントリビューション)

## 概要

Routinify Backendは、以下の機能を提供するRails APIアプリケーションです：

- **認証・認可**: Auth0を使用したJWT認証
- **タスク管理**: タスクのCRUD操作、ステータス管理
- **カテゴリ管理**: タスクの分類機能
- **RESTful API**: 標準的なREST API設計
- **セキュリティ**: 包括的なセキュリティ対策

## 技術スタック

### バックエンド
- **Ruby**: 3.3+
- **Rails**: 8.0+
- **PostgreSQL**: 15+
- **Redis**: 7+

### 認証・認可
- **Auth0**: JWT認証
- **JWT**: トークンベース認証

### 開発・テスト
- **RSpec**: テストフレームワーク
- **FactoryBot**: テストデータ生成
- **RuboCop**: 静的解析
- **Brakeman**: セキュリティチェック

### インフラ
- **Docker**: コンテナ化
- **Docker Compose**: 開発環境
- **Puma**: アプリケーションサーバー

## セットアップ

### 前提条件

- Ruby 3.3+
- Rails 8.0+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose（推奨）

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd Routinify/backend
```

### 2. 依存関係のインストール

```bash
bundle install
```

### 3. 環境変数の設定

```bash
cp .env.example .env
# .envファイルを編集して必要な環境変数を設定
```

### 4. データベースのセットアップ

```bash
rails db:create
rails db:migrate
rails db:seed
```

### 5. サーバーの起動

```bash
rails server
```

### Docker環境での開発

```bash
# 開発環境の起動
docker-compose up -d

# ログの確認
docker-compose logs -f backend

# コンテナ内でコマンド実行
docker-compose exec backend rails console
docker-compose exec backend rails db:migrate
```

## 開発

### 開発フロー

1. **ブランチ作成**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **開発・テスト**
   ```bash
   # コード実装
   # テスト作成・実行
   bundle exec rspec
   bundle exec rubocop
   ```

3. **プルリクエスト作成**
   - テンプレートに従って記入
   - レビュアーを指定
   - 関連するIssueをリンク

### コーディング規約

詳細なコーディング規約については、以下のドキュメントを参照してください：

- [コーディング規約](CODING_STANDARDS.md)
- [アーキテクチャガイド](ARCHITECTURE_GUIDE.md)
- [開発ガイド](DEVELOPMENT_GUIDE.md)

### 静的解析

```bash
# RuboCopの実行
bundle exec rubocop

# 自動修正
bundle exec rubocop -a

# セキュリティチェック
bundle exec brakeman
```

## テスト

### テストの実行

```bash
# 全テスト実行
bundle exec rspec

# 特定のファイル
bundle exec rspec spec/models/task_spec.rb

# カバレッジ付き
COVERAGE=true bundle exec rspec

# 並列実行
bundle exec rspec --parallel
```

### テストの種類

- **モデルテスト**: バリデーション、アソシエーション、ビジネスロジック
- **リクエストテスト**: APIエンドポイントの動作確認
- **サービステスト**: ビジネスロジックのテスト
- **統合テスト**: 複数コンポーネントの連携テスト

## デプロイ

### 本番環境へのデプロイ

1. **デプロイ前チェック**
   ```bash
   bundle exec rspec
   bundle exec rubocop
   bundle exec brakeman
   ```

2. **データベースマイグレーション**
   ```bash
   rails db:migrate
   ```

3. **アセットのプリコンパイル**
   ```bash
   rails assets:precompile
   ```

4. **ヘルスチェック**
   ```bash
   curl http://localhost:3000/up
   ```

### 環境別設定

- **開発環境**: `config/environments/development.rb`
- **テスト環境**: `config/environments/test.rb`
- **本番環境**: `config/environments/production.rb`

## ドキュメント

### API仕様

- **OpenAPI仕様**: `api/openapi.yaml`
- **APIドキュメント**: [API Documentation](https://api.routinify.com/docs)

### 開発ドキュメント

- [コーディング規約](CODING_STANDARDS.md) - コードの書き方と規約
- [アーキテクチャガイド](ARCHITECTURE_GUIDE.md) - システム設計とアーキテクチャ
- [開発ガイド](DEVELOPMENT_GUIDE.md) - 開発フローとツール

### データベース設計

- **スキーマ**: `db/schema.rb`
- **マイグレーション**: `db/migrate/`
- **シードデータ**: `db/seeds.rb`

## コントリビューション

### プルリクエストの作成

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

### コーディング規約

- [コーディング規約](CODING_STANDARDS.md)に従ってください
- テストを必ず書いてください
- プルリクエスト前に`bundle exec rubocop`と`bundle exec rspec`を実行してください

### Issue報告

バグ報告や機能要求は、GitHubのIssue機能を使用してください。

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は[LICENSE](LICENSE)ファイルを参照してください。

## サポート

質問やサポートが必要な場合は、以下の方法でお問い合わせください：

- GitHub Issues: [Issues](https://github.com/your-org/routinify/issues)
- メール: support@routinify.com
- ドキュメント: [Documentation](https://docs.routinify.com)

---

**Routinify Backend** - 効率的なタスク管理のためのAPIサーバー
