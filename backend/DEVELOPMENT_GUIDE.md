# Routinify Backend 開発ガイド

## 📋 目次

1. [開発環境セットアップ](#開発環境セットアップ)
2. [開発フロー](#開発フロー)
3. [コーディング規約](#コーディング規約)
4. [テスト戦略](#テスト戦略)
5. [デバッグとログ](#デバッグとログ)
6. [パフォーマンス監視](#パフォーマンス監視)
7. [セキュリティチェック](#セキュリティチェック)
8. [デプロイメント](#デプロイメント)

---

## 開発環境セットアップ

### 必要な環境

- Ruby 3.3+
- Rails 8.0+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose（推奨）

### セットアップ手順

```bash
# 1. リポジトリのクローン
git clone <repository-url>
cd Routinify/backend

# 2. 依存関係のインストール
bundle install

# 3. データベースのセットアップ
rails db:create
rails db:migrate
rails db:seed

# 4. 環境変数の設定
cp .env.example .env
# .envファイルを編集

# 5. サーバーの起動
rails server
```

### Docker環境での開発

```bash
# Docker Composeで開発環境を起動
docker-compose up -d

# ログの確認
docker-compose logs -f backend

# コンテナ内でコマンド実行
docker-compose exec backend rails console
docker-compose exec backend rails db:migrate
```

---

## 開発フロー

### 1. ブランチ戦略

```bash
# メインブランチ
main                    # 本番環境
develop                 # 開発環境

# 機能ブランチ
feature/task-validation
feature/user-authentication
feature/api-versioning

# 修正ブランチ
fix/n-plus-one-query
fix/auth-token-expiry

# リファクタリングブランチ
refactor/task-service
refactor/error-handling

# ドキュメントブランチ
docs/api-specification
docs/deployment-guide
```

### 2. コミット規約

```bash
# コミットメッセージの形式
<type>(<scope>): <description>

# 例
feat(auth): JWT認証の実装を追加
fix(api): タスク一覧APIのN+1問題を修正
docs(readme): セットアップ手順を更新
refactor(service): TaskServiceをリファクタリング
test(controller): タスクコントローラーのテストを追加

# タイプ一覧
feat:     新機能
fix:      バグ修正
docs:     ドキュメント
style:    コードスタイル（フォーマット等）
refactor: リファクタリング
test:     テスト
chore:    ビルドプロセス、依存関係等
```

### 3. プルリクエストの流れ

1. **ブランチ作成**
   ```bash
   git checkout -b feature/task-validation
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

4. **コードレビュー**
   - レビュアーによるチェック
   - 必要に応じて修正

5. **マージ**
   - 承認後、developブランチにマージ
   - ブランチの削除

---

## コーディング規約

### 1. 静的解析ツール

```bash
# RuboCopの実行
bundle exec rubocop

# 自動修正
bundle exec rubocop -a

# 特定ファイルのみ
bundle exec rubocop app/controllers/api/v1/tasks_controller.rb

# 設定ファイルの確認
bundle exec rubocop --show-cops
```

### 2. コードフォーマット

```ruby
# ✅ 良い例
def create_task(params)
  task = Task.new(params.merge(account_id: current_user_id))
  
  if task.save
    render_success(data: task, message: 'タスクが作成されました')
  else
    render_error(errors: task.errors.full_messages)
  end
end

# ❌ 悪い例
def create_task(params)
task = Task.new(params.merge(account_id: current_user_id))
if task.save
render_success(data: task, message: 'タスクが作成されました')
else
render_error(errors: task.errors.full_messages)
end
end
```

### 3. 命名規則

```ruby
# クラス・モジュール（PascalCase）
class TaskService
module Api::V1

# メソッド・変数（snake_case）
def create_task
  user_id = current_user_id
end

# 定数（SCREAMING_SNAKE_CASE）
MAX_TASK_TITLE_LENGTH = 255
REQUIRES_AUTHENTICATION = { message: 'Requires authentication' }.freeze

# データベース（snake_case、複数形）
create_table :tasks
add_column :tasks, :due_date, :datetime
```

---

## テスト戦略

### 1. テストの種類

```ruby
# モデルテスト（spec/models/）
RSpec.describe Task, type: :model do
  describe 'validations' do
    it { should validate_presence_of(:title) }
    it { should validate_length_of(:title).is_at_most(255) }
  end

  describe 'associations' do
    it { should belong_to(:category).optional }
  end

  describe 'scopes' do
    it 'returns overdue tasks' do
      overdue_task = create(:task, due_date: 1.day.ago)
      current_task = create(:task, due_date: 1.day.from_now)
      
      expect(Task.overdue).to include(overdue_task)
      expect(Task.overdue).not_to include(current_task)
    end
  end
end

# リクエストテスト（spec/requests/）
RSpec.describe Api::V1::TasksController, type: :request do
  describe 'GET /api/v1/tasks' do
    it 'タスク一覧を取得できる' do
      task = create(:task, account_id: user_id)
      get '/api/v1/tasks'
      
      expect(response).to have_http_status(:ok)
      expect(json_response['data']).to be_an(Array)
    end
  end
end

# サービステスト（spec/services/）
RSpec.describe TaskService do
  describe '#create' do
    it 'タスクを作成できる' do
      result = service.create(valid_params)
      
      expect(result.success?).to be true
      expect(result.data).to be_a(Task)
    end
  end
end
```

### 2. テスト実行

```bash
# 全テスト実行
bundle exec rspec

# 特定のファイル
bundle exec rspec spec/models/task_spec.rb

# 特定のテスト
bundle exec rspec spec/models/task_spec.rb:10

# カバレッジ付き
COVERAGE=true bundle exec rspec

# 並列実行
bundle exec rspec --parallel
```

### 3. テストデータ管理

```ruby
# ファクトリー（spec/factories/tasks.rb）
FactoryBot.define do
  factory :task do
    sequence(:account_id) { |n| "user-#{n}" }
    sequence(:title) { |n| "タスク #{n}" }
    due_date { 1.week.from_now }
    status { '未着手' }
    priority { 'medium' }

    trait :completed do
      status { '完了' }
    end

    trait :overdue do
      due_date { 1.day.ago }
    end
  end
end

# 使用例
let(:task) { create(:task, :completed, account_id: user_id) }
let(:overdue_task) { create(:task, :overdue) }
```

---

## デバッグとログ

### 1. ログレベル

```ruby
# ログの出力
Rails.logger.debug "デバッグ情報: #{variable}"
Rails.logger.info "情報: タスクが作成されました"
Rails.logger.warn "警告: パフォーマンスの問題が検出されました"
Rails.logger.error "エラー: データベース接続に失敗しました"

# 構造化ログ
Rails.logger.info({
  event: 'task_created',
  user_id: current_user_id,
  task_id: task.id,
  duration: Time.current - start_time
}.to_json)
```

### 2. デバッグツール

```ruby
# pry-byebugの使用
def create_task(params)
  binding.pry # デバッグポイント
  task = Task.new(params)
  # ...
end

# ログの確認
tail -f log/development.log

# 特定のログレベル
grep "ERROR" log/development.log
grep "WARN" log/development.log
```

### 3. エラーハンドリング

```ruby
# 例外のキャッチとログ出力
def create_task(params)
  begin
    task = Task.new(params)
    task.save!
    render_success(data: task)
  rescue ActiveRecord::RecordInvalid => e
    Rails.logger.error "Validation failed: #{e.message}"
    render_error(errors: e.record.errors.full_messages)
  rescue StandardError => e
    Rails.logger.error "Unexpected error: #{e.message}"
    Rails.logger.error e.backtrace.join("\n")
    render_error(errors: ['内部サーバーエラーが発生しました'])
  end
end
```

---

## パフォーマンス監視

### 1. クエリ最適化

```ruby
# N+1問題の回避
# ❌ 悪い例
tasks = Task.for_user(user_id)
tasks.each { |task| puts task.category.name } # N+1問題

# ✅ 良い例
tasks = Task.for_user(user_id).includes(:category)
tasks.each { |task| puts task.category.name } # 1回のクエリ

# インデックスの活用
add_index :tasks, :account_id
add_index :tasks, [:account_id, :status]
add_index :tasks, [:account_id, :due_date]
```

### 2. キャッシュの活用

```ruby
# フラグメントキャッシュ
def index
  cache_key = "tasks:#{current_user_id}:#{params[:page]}"
  tasks = Rails.cache.fetch(cache_key, expires_in: 5.minutes) do
    Task.for_user(current_user_id).includes(:category).to_a
  end
  render_success(data: tasks)
end

# Redisキャッシュ
def show
  cache_key = "task:#{params[:id]}"
  task = Rails.cache.fetch(cache_key, expires_in: 1.hour) do
    Task.find(params[:id])
  end
  render_success(data: task)
end
```

### 3. パフォーマンス測定

```ruby
# 実行時間の測定
def create_task(params)
  start_time = Time.current
  
  task = Task.new(params)
  task.save!
  
  duration = Time.current - start_time
  Rails.logger.info "Task creation took #{duration} seconds"
  
  render_success(data: task)
end

# メモリ使用量の監視
def index
  memory_before = `ps -o rss= -p #{Process.pid}`.to_i
  
  tasks = Task.for_user(current_user_id)
  
  memory_after = `ps -o rss= -p #{Process.pid}`.to_i
  memory_used = memory_after - memory_before
  
  Rails.logger.info "Memory used: #{memory_used} KB"
end
```

---

## セキュリティチェック

### 1. 脆弱性スキャン

```bash
# Brakemanによる静的解析
bundle exec brakeman

# 依存関係の脆弱性チェック
bundle audit

# セキュリティテスト
bundle exec rspec spec/security/
```

### 2. 認証・認可の確認

```ruby
# 認証のテスト
RSpec.describe 'Authentication' do
  it '認証されていない場合は401エラーが返される' do
    get '/api/v1/tasks'
    expect(response).to have_http_status(:unauthorized)
  end

  it '無効なトークンで403エラーが返される' do
    get '/api/v1/tasks', headers: { 'Authorization' => 'Bearer invalid_token' }
    expect(response).to have_http_status(:forbidden)
  end
end

# 認可のテスト
RSpec.describe 'Authorization' do
  it '他のユーザーのタスクにアクセスできない' do
    other_user_task = create(:task, account_id: 'other-user')
    get "/api/v1/tasks/#{other_user_task.id}"
    expect(response).to have_http_status(:not_found)
  end
end
```

### 3. 入力検証

```ruby
# SQLインジェクション対策
scope :search, ->(query) { where('title ILIKE ?', "%#{query}%") }

# XSS対策
def task_params
  params.require(:task).permit(:title, :description)
end

# CSRF対策（APIの場合は不要だが、設定確認）
protect_from_forgery with: :null_session
```

---

## デプロイメント

### 1. 環境別設定

```ruby
# config/environments/production.rb
Rails.application.configure do
  config.cache_classes = true
  config.eager_load = true
  config.consider_all_requests_local = false
  config.public_file_server.enabled = ENV['RAILS_SERVE_STATIC_FILES'].present?
  
  # ログ設定
  config.log_level = :info
  config.log_tags = [:request_id]
  
  # セキュリティ設定
  config.force_ssl = true
  config.ssl_options = { redirect: { exclude: ->(request) { request.path =~ /health/ } } }
end
```

### 2. デプロイ前チェック

```bash
# テスト実行
bundle exec rspec

# 静的解析
bundle exec rubocop
bundle exec brakeman

# データベースマイグレーション
rails db:migrate:status
rails db:migrate

# アセットのプリコンパイル
rails assets:precompile

# ヘルスチェック
curl http://localhost:3000/up
```

### 3. 本番環境での監視

```ruby
# ヘルスチェックエンドポイント
class HealthController < ApplicationController
  def show
    render json: {
      status: 'ok',
      timestamp: Time.current.iso8601,
      version: Rails.application.config.version
    }
  end
end

# メトリクス収集
def create_task(params)
  start_time = Time.current
  
  # 処理
  
  duration = Time.current - start_time
  StatsD.timing('task.creation.duration', duration)
  StatsD.increment('task.creation.count')
end
```

---

## まとめ

この開発ガイドに従うことで、以下の効果が期待できます：

- **開発効率の向上**: 統一されたフローとツールによる効率的な開発
- **品質の向上**: テストと静的解析による品質保証
- **保守性の向上**: 一貫したコーディング規約による理解しやすいコード
- **セキュリティの強化**: 定期的なチェックによる脆弱性の早期発見

このガイドは、チームの成長とプロジェクトの進化に合わせて継続的に更新していきます。
