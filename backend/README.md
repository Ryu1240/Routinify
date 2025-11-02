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
- **タスク管理**: タスクのCRUD操作、ステータス管理、優先度設定
- **カテゴリ管理**: タスクの分類機能
- **習慣化タスク**: 繰り返しタスクの自動生成機能
  - 日次・週次・月次・カスタム頻度の設定
  - 未完了タスク数の上限管理
  - 非同期タスク生成ジョブ
  - 期限日の自動計算
- **マイルストーン**: 複数のタスクをグループ化し、進捗状況を追跡する機能
  - マイルストーンのCRUD操作
  - タスクとの関連付け・解除
  - 進捗率の自動計算
  - ステータス管理（planning, in_progress, completed, cancelled）
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
bundle exec ridgepole --config ./config/database.yml --file ./db/Schemafile --apply
rails db:seed
```

#### シードデータの管理

シードデータには以下のオプションがあります：

**通常のシード実行（既存データは保持）**
```bash
# Docker環境
make seed
# または
docker compose exec backend bundle exec rails db:seed

# ローカル環境
rails db:seed
```

**既存データを削除してからシード実行（クリーンな状態から開始）**
```bash
# Docker環境（推奨）
make seed-reset
# または
docker compose exec backend bundle exec rails db:seed:reset

# ローカル環境
rails db:seed:reset

# 環境変数を使用する方法
RESET_SEED=true rails db:seed
```

**シードデータの削除のみ**
```bash
# Docker環境
make seed-cleanup
# または
docker compose exec backend bundle exec rails db:seed:cleanup

# ローカル環境
rails db:seed:cleanup
```

**注意**: `seed-reset`と`seed-cleanup`は開発環境とテスト環境でのみ実行可能です。本番環境では実行できません。

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
docker-compose exec backend bundle exec ridgepole --config ./config/database.yml --file ./db/Schemafile --apply
```

## 開発

### Ridgepoleによるスキーマ管理

このプロジェクトでは、Rails標準のマイグレーションではなく、Ridgepoleを使用してデータベーススキーマを管理しています。

#### Ridgepoleとは

- Schemafileベースでデータベーススキーマを宣言的に定義
- スキーマの差分を自動検出・適用
- `db/schemas/` ディレクトリにテーブルごとのスキーマファイルを配置

#### 基本コマンド

```bash
# スキーマの適用
bundle exec ridgepole --config ./config/database.yml --file ./db/Schemafile --apply

# または Make コマンド（推奨）
make ridgepole-apply  # または make ra

# スキーマ変更のドライラン（実際には適用しない）
make ridgepole-dry-run  # または make rr
```

#### スキーマファイルの編集

1. `db/schemas/` ディレクトリ内の該当ファイルを編集
   - 例: `db/schemas/tasks.rb`, `db/schemas/categories.rb`
2. `db/Schemafile` に新しいスキーマファイルをrequire（新規テーブルの場合）
3. `make ridgepole-dry-run` で変更内容を確認
4. `make ridgepole-apply` で変更を適用

#### 新規テーブルの追加例

```ruby
# db/schemas/new_table.rb
create_table 'new_table', force: :cascade do |t|
  t.string 'name', limit: 255
  t.timestamps
end

# インデックスの追加
add_index 'new_table', ['name'], name: 'index_new_table_on_name'
```

#### 注意事項

- Rails標準の `rails db:migrate` は使用しません
- スキーマ変更は必ずRidgepoleを通して実行
- 本番環境へのデプロイ前は必ず `ridgepole-dry-run` で確認
- チーム全体でRidgepoleを使用することで、スキーマの一貫性を保ちます

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

2. **データベーススキーマの適用**
   ```bash
   bundle exec ridgepole --config ./config/database.yml --file ./db/Schemafile --apply
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

- **OpenAPI仕様**: `../api/openapi.yaml`（ルートディレクトリからの相対パス）
- **Swagger UI**: http://localhost:8080（開発環境）

#### データ形式の規約

**重要**: バックエンドは、フロントエンド側に**キャメルケース（camelCase）**の状態でデータを返すことが必須です。

- **データベース**: snake_case（`account_id`, `due_date`, `created_at`など）
- **Rubyコード**: snake_case（変数名、メソッド名など）
- **APIレスポンス**: camelCase（`accountId`, `dueDate`, `createdAt`など）

この変換は**シリアライザー層**で実施します。

**レスポンス例**:
```json
{
  "data": {
    "id": 1,
    "accountId": "user-123",
    "title": "タスクタイトル",
    "dueDate": "2024-01-15T00:00:00.000Z",
    "status": "未着手",
    "priority": "medium",
    "categoryId": 1,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "タスクが正常に作成されました"
}
```

詳細は[コーディング規約](CODING_STANDARDS.md#レスポンス形式)を参照してください。

#### 主要なAPIエンドポイント

**タスク管理**
- `GET /api/v1/tasks` - タスク一覧取得
- `POST /api/v1/tasks` - タスク作成
- `GET /api/v1/tasks/:id` - タスク詳細取得
- `PUT /api/v1/tasks/:id` - タスク更新
- `DELETE /api/v1/tasks/:id` - タスク削除

**カテゴリ管理**
- `GET /api/v1/categories` - カテゴリ一覧取得
- `POST /api/v1/categories` - カテゴリ作成
- `PUT /api/v1/categories/:id` - カテゴリ更新
- `DELETE /api/v1/categories/:id` - カテゴリ削除

**習慣化タスク**
- `GET /api/v1/routine_tasks` - 習慣化タスク一覧取得
- `POST /api/v1/routine_tasks` - 習慣化タスク作成
- `GET /api/v1/routine_tasks/:id` - 習慣化タスク詳細取得
- `PUT /api/v1/routine_tasks/:id` - 習慣化タスク更新
- `DELETE /api/v1/routine_tasks/:id` - 習慣化タスク削除
- `POST /api/v1/routine_tasks/:id/generate` - タスク生成ジョブの開始
- `GET /api/v1/routine_tasks/:id/generation_status?job_id=:job_id` - タスク生成ジョブのステータス確認

**マイルストーン**
- `GET /api/v1/milestones` - マイルストーン一覧取得
- `POST /api/v1/milestones` - マイルストーン作成
- `GET /api/v1/milestones/:id` - マイルストーン詳細取得
- `PUT /api/v1/milestones/:id` - マイルストーン更新
- `DELETE /api/v1/milestones/:id` - マイルストーン削除
- `POST /api/v1/milestones/:id/tasks` - タスクをマイルストーンに関連付け
- `DELETE /api/v1/milestones/:id/tasks` - タスクの関連付けを解除

**ヘルスチェック**
- `GET /up` - アプリケーションの稼働状況確認

### 開発ドキュメント

- [コーディング規約](CODING_STANDARDS.md) - コードの書き方と規約
- [アーキテクチャガイド](ARCHITECTURE_GUIDE.md) - システム設計とアーキテクチャ
- [開発ガイド](DEVELOPMENT_GUIDE.md) - 開発フローとツール

### データベース設計

- **スキーマ管理**: Ridgepole（`db/Schemafile`）
- **スキーマ定義**: `db/schemas/` ディレクトリ内のテーブル定義ファイル
- **スキーマ設計書**: [DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) - テーブル構造とリレーションの詳細
- **シードデータ**: `db/seeds.rb`

**注意**: このプロジェクトではRails標準のマイグレーション（`db/migrate/`）は使用していません。

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
