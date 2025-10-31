# Routinify Backend アーキテクチャガイド

## 📋 目次

1. [アーキテクチャ概要](#アーキテクチャ概要)
2. [レイヤー構成](#レイヤー構成)
3. [ディレクトリ構造詳細](#ディレクトリ構造詳細)
4. [実装パターン](#実装パターン)
5. [設計原則](#設計原則)
6. [実装例](#実装例)

---

## アーキテクチャ概要

Routinify Backendは、Rails 8.0をベースとしたAPI専用アプリケーションです。
レイヤー分離と単一責任の原則に基づき、保守性と拡張性を重視した設計となっています。

### 主要機能

- **タスク管理**: 通常タスクのCRUD操作
- **カテゴリ管理**: タスクの分類機能
- **習慣化タスク管理**: 定期的にタスクを自動生成する習慣化機能
  - 頻度設定（daily, weekly, monthly, custom）
  - 自動生成ジョブによるタスク生成
  - 期限日のオフセット設定

### アーキテクチャ図

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                        │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP/HTTPS
┌─────────────────────▼───────────────────────────────────────┐
│                API Gateway Layer                           │
│  - Authentication (Auth0)                                  │
│  - Rate Limiting                                           │
│  - Request/Response Logging                                │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                Controller Layer                            │
│  - Request Validation                                      │
│  - Authentication/Authorization                           │
│  - Response Formatting                                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 Service Layer                              │
│  - Business Logic                                          │
│  - Data Processing                                         │
│  - External API Integration                                │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 Model Layer                                │
│  - Data Validation                                         │
│  - Database Operations                                     │
│  - Business Rules                                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│               Database Layer                               │
│  - PostgreSQL                                             │
│  - Redis (Cache)                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## レイヤー構成

### 1. Controller Layer（コントローラー層）

**責任**: HTTPリクエストの処理、認証・認可、レスポンス形式の統一

```ruby
# app/controllers/api/v1/base_controller.rb
module Api
  module V1
    class BaseController < ApplicationController
      # 共通のレスポンス処理
      # エラーハンドリング
      # 認証・認可の共通処理
    end
  end
end
```

### 2. Service Layer（サービス層）

**責任**: ビジネスロジックの実装、複雑な処理の調整

```ruby
# app/services/base_service.rb
class BaseService
  # 共通のサービス機能
  # エラーハンドリング
  # ログ出力
end
```

### 3. Model Layer（モデル層）

**責任**: データの検証、データベース操作、ビジネスルール

```ruby
# app/models/task.rb
class Task < ApplicationRecord
  # バリデーション
  # アソシエーション
  # ビジネスロジック
end
```

### 4. Serializer Layer（シリアライザー層）

**責任**: レスポンスデータの整形、API形式の統一

```ruby
# app/serializers/task_serializer.rb
class TaskSerializer
  # レスポンス形式の定義
  # データ変換
end
```

---

## ディレクトリ構造詳細

```
backend/
├── app/
│   ├── controllers/                    # コントローラー層
│   │   ├── api/
│   │   │   └── v1/                    # API v1
│   │   │       ├── base_controller.rb # 共通コントローラー
│   │   │       ├── tasks_controller.rb
│   │   │       ├── categories_controller.rb
│   │   │       └── routine_tasks_controller.rb
│   │   ├── concerns/                   # 共通機能
│   │   │   ├── secured.rb             # 認証・認可
│   │   │   ├── error_handler.rb       # エラーハンドリング
│   │   │   └── response_formatter.rb  # レスポンス整形
│   │   └── application_controller.rb
│   │
│   ├── models/                         # モデル層
│   │   ├── concerns/                   # モデル共通機能
│   │   │   ├── account_scoped.rb      # アカウントスコープ
│   │   │   └── timestamped.rb         # タイムスタンプ
│   │   ├── task.rb
│   │   ├── category.rb
│   │   ├── routine_task.rb
│   │   └── application_record.rb
│   │
│   ├── services/                       # サービス層
│   │   ├── base_service.rb            # 基底サービス
│   │   ├── task_service.rb
│   │   ├── category_service.rb
│   │   └── auth_service.rb
│   │
│   ├── serializers/                    # シリアライザー層
│   │   ├── base_serializer.rb         # 基底シリアライザー
│   │   ├── task_serializer.rb
│   │   ├── category_serializer.rb
│   │   └── routine_task_serializer.rb
│   │
│   ├── validators/                     # カスタムバリデーター
│   │   ├── future_date_validator.rb
│   │   └── unique_within_account_validator.rb
│   │
│   ├── jobs/                          # バックグラウンドジョブ
│   │   ├── application_job.rb
│   │   ├── routine_task_generator_job.rb  # 習慣化タスクの自動生成ジョブ
│   │   └── task_notification_job.rb
│   │
│   └── mailers/                       # メーラー
│       ├── application_mailer.rb
│       └── task_mailer.rb
│
├── config/
│   ├── initializers/                  # 初期化設定
│   │   ├── cors.rb
│   │   ├── auth0.rb
│   │   ├── redis.rb
│   │   └── i18n.rb
│   ├── locales/                       # 国際化
│   │   ├── ja.yml
│   │   └── en.yml
│   └── environments/                  # 環境別設定
│
├── lib/                               # ライブラリ
│   ├── auth0_client.rb               # Auth0クライアント
│   ├── redis_client.rb               # Redisクライアント
│   └── tasks/                        # カスタムタスク
│       └── data_migration.rake
│
├── spec/                              # テスト
│   ├── factories/                     # ファクトリー
│   ├── models/                        # モデルテスト
│   ├── requests/                      # リクエストテスト
│   ├── services/                      # サービステスト
│   ├── serializers/                   # シリアライザーテスト
│   └── support/                       # テスト支援
│       ├── authorization_helper.rb
│       ├── database_cleaner.rb
│       └── json_helper.rb
│
└── db/
    ├── schema.rb                      # スキーマ
    ├── seeds.rb                       # シードデータ
    └── schemas/                       # スキーマ定義
        ├── tasks.rb
        └── categories.rb
```

---

## 実装パターン

### 1. BaseController パターン

```ruby
# app/controllers/api/v1/base_controller.rb
module Api
  module V1
    class BaseController < ApplicationController
      include ErrorHandler
      include ResponseFormatter

      before_action :authenticate_user
      before_action :set_pagination_params

      private

      def authenticate_user
        # 認証処理
      end

      def set_pagination_params
        @page = params[:page]&.to_i || 1
        @per_page = params[:per_page]&.to_i || 20
      end

      def render_success(data: nil, message: nil, status: :ok)
        response = { success: true }
        response[:data] = data if data
        response[:message] = message if message
        render json: response, status: status
      end

      def render_error(errors:, status: :unprocessable_entity)
        render json: { success: false, errors: errors }, status: status
      end
    end
  end
end
```

### 2. Service Object パターン

```ruby
# app/services/base_service.rb
class BaseService
  class ServiceResult
    attr_reader :success, :data, :errors, :message, :status

    def initialize(success:, data: nil, errors: [], message: nil, status: :ok)
      @success = success
      @data = data
      @errors = errors
      @message = message
      @status = status
    end

    def self.success(data: nil, message: nil, status: :ok)
      new(success: true, data: data, message: message, status: status)
    end

    def self.error(errors: [], status: :unprocessable_entity)
      new(success: false, errors: errors, status: status)
    end

    def success?
      @success
    end

    def error?
      !@success
    end
  end

  private

  def log_error(error, context = {})
    Rails.logger.error "#{self.class.name}: #{error.message}"
    Rails.logger.error "Context: #{context}" if context.any?
    Rails.logger.error error.backtrace.join("\n")
  end
end
```

### 3. Serializer パターン

```ruby
# app/serializers/base_serializer.rb
class BaseSerializer
  def initialize(object)
    @object = object
  end

  def as_json
    raise NotImplementedError, 'Subclasses must implement as_json method'
  end

  private

  def format_datetime(datetime)
    datetime&.iso8601(3)
  end

  def format_date(date)
    date&.iso8601
  end
end
```

---

## 設計原則

### 1. 単一責任の原則（SRP）

各クラスは一つの責任のみを持つ

```ruby
# ✅ 良い例
class TaskService
  def create(params)
    # タスク作成のみ
  end
end

class TaskSerializer
  def as_json
    # シリアライゼーションのみ
  end
end

# ❌ 悪い例
class TaskController
  def create
    # 認証 + バリデーション + ビジネスロジック + シリアライゼーション
  end
end
```

### 2. 開放閉鎖の原則（OCP）

拡張に対して開いており、修正に対して閉じている

```ruby
# ✅ 良い例
class BaseService
  def execute
    # 共通処理
    perform
    # 共通処理
  end

  private

  def perform
    raise NotImplementedError
  end
end

class TaskService < BaseService
  private

  def perform
    # タスク固有の処理
  end
end
```

### 3. 依存性逆転の原則（DIP）

抽象に依存し、具象に依存しない

```ruby
# ✅ 良い例
class TaskService
  def initialize(user_id, serializer: TaskSerializer)
    @user_id = user_id
    @serializer = serializer
  end

  def create(params)
    task = Task.new(params.merge(account_id: @user_id))
    if task.save
      ServiceResult.success(data: @serializer.new(task).as_json)
    else
      ServiceResult.error(errors: task.errors.full_messages)
    end
  end
end
```

---

## 実装例

### 完全なタスク管理APIの実装例

#### 1. モデル

```ruby
# app/models/task.rb
class Task < ApplicationRecord
  include AccountScoped

  belongs_to :category, optional: true

  validates :title, presence: true, length: { maximum: 255 }
  validates :status, inclusion: { in: %w[未着手 進行中 完了 保留] }, allow_nil: true
  validates :priority, inclusion: { in: %w[low medium high] }, allow_nil: true
  validates :due_date, future_date: true, allow_nil: true

  scope :by_status, ->(status) { where(status: status) }
  scope :overdue, -> { where('due_date < ?', Time.current) }
  scope :due_today, -> { where(due_date: Date.current.beginning_of_day..Date.current.end_of_day) }

  def overdue?
    due_date.present? && due_date < Time.current
  end

  def completed?
    status == '完了'
  end
end
```

#### 2. サービス

```ruby
# app/services/task_service.rb
class TaskService < BaseService
  def initialize(user_id)
    @user_id = user_id
  end

  def list(filters = {})
    tasks = Task.for_user(@user_id)
    tasks = apply_filters(tasks, filters)
    tasks = tasks.includes(:category)
    
    ServiceResult.success(data: tasks.map { |task| TaskSerializer.new(task).as_json })
  end

  def create(params)
    task = Task.new(params.merge(account_id: @user_id))
    
    if task.save
      ServiceResult.success(
        data: TaskSerializer.new(task).as_json,
        message: I18n.t('messages.task.created')
      )
    else
      ServiceResult.error(errors: task.errors.full_messages)
    end
  end

  def find(id)
    task = Task.find_by(id: id, account_id: @user_id)
    
    if task
      ServiceResult.success(data: TaskSerializer.new(task).as_json)
    else
      ServiceResult.error(errors: [I18n.t('errors.task.not_found')], status: :not_found)
    end
  end

  def update(id, params)
    task = Task.find_by(id: id, account_id: @user_id)
    return ServiceResult.error(errors: [I18n.t('errors.task.not_found')], status: :not_found) unless task

    if task.update(params)
      ServiceResult.success(
        data: TaskSerializer.new(task).as_json,
        message: I18n.t('messages.task.updated')
      )
    else
      ServiceResult.error(errors: task.errors.full_messages)
    end
  end

  def destroy(id)
    task = Task.find_by(id: id, account_id: @user_id)
    return ServiceResult.error(errors: [I18n.t('errors.task.not_found')], status: :not_found) unless task

    task.destroy
    ServiceResult.success(message: I18n.t('messages.task.deleted'), status: :no_content)
  end

  private

  def apply_filters(tasks, filters)
    tasks = tasks.by_status(filters[:status]) if filters[:status].present?
    tasks = tasks.overdue if filters[:overdue] == 'true'
    tasks = tasks.due_today if filters[:due_today] == 'true'
    tasks
  end
end
```

#### 3. シリアライザー

```ruby
# app/serializers/task_serializer.rb
class TaskSerializer < BaseSerializer
  def as_json
    {
      id: @object.id,
      accountId: @object.account_id,
      title: @object.title,
      dueDate: format_datetime(@object.due_date),
      status: @object.status,
      priority: @object.priority,
      categoryId: @object.category_id,
      categoryName: @object.category&.name,
      overdue: @object.overdue?,
      completed: @object.completed?,
      createdAt: format_datetime(@object.created_at),
      updatedAt: format_datetime(@object.updated_at)
    }
  end
end
```

#### 4. コントローラー

```ruby
# app/controllers/api/v1/tasks_controller.rb
module Api
  module V1
    class TasksController < BaseController
      def index
        validate_permissions(['read:tasks']) do
          result = TaskService.new(current_user_id).list(search_params)
          handle_service_result(result)
        end
      end

      def create
        validate_permissions(['write:tasks']) do
          result = TaskService.new(current_user_id).create(task_params)
          handle_service_result(result)
        end
      end

      def show
        validate_permissions(['read:tasks']) do
          result = TaskService.new(current_user_id).find(params[:id])
          handle_service_result(result)
        end
      end

      def update
        validate_permissions(['write:tasks']) do
          result = TaskService.new(current_user_id).update(params[:id], task_params)
          handle_service_result(result)
        end
      end

      def destroy
        validate_permissions(['delete:tasks']) do
          result = TaskService.new(current_user_id).destroy(params[:id])
          handle_service_result(result)
        end
      end

      private

      def task_params
        params.require(:task).permit(:title, :due_date, :status, :priority, :category_id)
      end

      def search_params
        params.permit(:status, :overdue, :due_today, :page, :per_page)
      end
    end
  end
end
```

#### 5. テスト

```ruby
# spec/requests/api/v1/tasks_controller_spec.rb
RSpec.describe Api::V1::TasksController, type: :request do
  let(:user_id) { 'test-user-id' }
  let(:task) { create(:task, account_id: user_id) }

  before do
    mock_request_authentication(user_id: user_id)
  end

  describe 'GET /api/v1/tasks' do
    it 'タスク一覧を取得できる' do
      task
      get '/api/v1/tasks'
      
      expect(response).to have_http_status(:ok)
      expect(json_response['success']).to be true
      expect(json_response['data']).to be_an(Array)
      expect(json_response['data'].first['id']).to eq(task.id)
    end

    it 'フィルタリングが動作する' do
      create(:task, account_id: user_id, status: '未着手')
      create(:task, account_id: user_id, status: '完了')
      
      get '/api/v1/tasks', params: { status: '未着手' }
      
      expect(response).to have_http_status(:ok)
      expect(json_response['data'].count).to eq(1)
      expect(json_response['data'].first['status']).to eq('未着手')
    end
  end

  describe 'POST /api/v1/tasks' do
    let(:valid_params) do
      {
        task: {
          title: 'テストタスク',
          due_date: 1.week.from_now.iso8601,
          status: '未着手',
          priority: 'medium'
        }
      }
    end

    it 'タスクを作成できる' do
      expect {
        post '/api/v1/tasks', params: valid_params
      }.to change(Task, :count).by(1)
      
      expect(response).to have_http_status(:created)
      expect(json_response['success']).to be true
      expect(json_response['message']).to eq('タスクが正常に作成されました')
    end

    it '無効なパラメータでエラーが返される' do
      post '/api/v1/tasks', params: { task: { title: '' } }
      
      expect(response).to have_http_status(:unprocessable_entity)
      expect(json_response['success']).to be false
      expect(json_response['errors']).to include('タイトルは必須です')
    end
  end
end
```

---

## まとめ

このアーキテクチャガイドに従うことで、以下の効果が期待できます：

- **保守性**: レイヤー分離により、各層の責任が明確
- **拡張性**: 新しい機能追加時の影響範囲を最小化
- **テスタビリティ**: 各層を独立してテスト可能
- **可読性**: 一貫したパターンにより、理解しやすいコード

このガイドは、プロジェクトの成長に合わせて継続的に更新していきます。
