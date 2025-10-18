# Routinify Backend コーディング規約

## 📋 目次

1. [概要](#概要)
2. [ファイル構造とディレクトリ配置](#ファイル構造とディレクトリ配置)
3. [命名規則](#命名規則)
4. [コーディングスタイル](#コーディングスタイル)
5. [API設計規約](#api設計規約)
6. [コントローラー規約](#コントローラー規約)
7. [モデル規約](#モデル規約)
8. [サービス層規約](#サービス層規約)
9. [テスト規約](#テスト規約)
10. [セキュリティ規約](#セキュリティ規約)
11. [パフォーマンス規約](#パフォーマンス規約)
12. [エラーハンドリング規約](#エラーハンドリング規約)
13. [国際化（i18n）規約](#国際化i18n規約)
14. [Git規約](#git規約)

---

## 概要

このドキュメントは、Routinify Backend（Rails API）の開発におけるコーディング規約を定義します。
Rails 8.0のベストプラクティスに基づき、保守性、可読性、パフォーマンスを重視した規約を定めています。

### 基本原則

- **DRY (Don't Repeat Yourself)**: 重複を避ける
- **SOLID原則**: 単一責任、開放閉鎖、リスコフ置換、インターフェース分離、依存性逆転
- **RESTful API**: 標準的なREST API設計
- **セキュリティファースト**: セキュリティを最優先に考慮
- **テストファースト**: テスト可能なコードを書く

---

## ファイル構造とディレクトリ配置

### ディレクトリ構造

```
backend/
├── app/
│   ├── controllers/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── base_controller.rb          # API共通コントローラー
│   │   │       ├── tasks_controller.rb
│   │   │       └── categories_controller.rb
│   │   ├── concerns/                           # 共通機能
│   │   │   └── secured.rb
│   │   └── application_controller.rb
│   ├── models/
│   │   ├── concerns/                           # モデル共通機能
│   │   ├── task.rb
│   │   └── category.rb
│   ├── services/                               # ビジネスロジック
│   │   ├── base_service.rb
│   │   ├── task_service.rb
│   │   └── category_service.rb
│   ├── serializers/                            # レスポンス整形
│   │   ├── base_serializer.rb
│   │   ├── task_serializer.rb
│   │   └── category_serializer.rb
│   └── validators/                             # カスタムバリデーター
├── config/
│   ├── initializers/
│   └── locales/
│       ├── ja.yml
│       └── en.yml
├── lib/
│   ├── auth0_client.rb
│   └── tasks/
├── spec/
│   ├── factories/
│   ├── models/
│   ├── requests/
│   ├── services/
│   └── support/
└── db/
    ├── schema.rb
    └── schemas/
```

### ファイル配置ルール

- **コントローラー**: `app/controllers/api/v1/`
- **モデル**: `app/models/`
- **サービス**: `app/services/`
- **シリアライザー**: `app/serializers/`
- **バリデーター**: `app/validators/`
- **テスト**: `spec/` 配下で対応するディレクトリ構造を維持

---

## 命名規則

### クラス・モジュール

```ruby
# ✅ 良い例
class TasksController < ApplicationController
class TaskService
module Api::V1
class BaseSerializer

# ❌ 悪い例
class tasks_controller < ApplicationController
class TaskServiceClass
module api::v1
```

### メソッド・変数

```ruby
# ✅ 良い例（snake_case）
def create_task
  user_id = current_user_id
  task_params = params.require(:task)
end

# ❌ 悪い例
def createTask
  userId = current_user_id
  taskParams = params.require(:task)
end
```

### 定数

```ruby
# ✅ 良い例（SCREAMING_SNAKE_CASE）
REQUIRES_AUTHENTICATION = { message: 'Requires authentication' }.freeze
MAX_TASK_TITLE_LENGTH = 255

# ❌ 悪い例
requires_authentication = { message: 'Requires authentication' }
maxTaskTitleLength = 255
```

### データベース

```ruby
# ✅ 良い例（snake_case、複数形）
create_table :tasks do |t|
  t.string :title
  t.datetime :due_date
  t.references :account, null: false, foreign_key: true
end

# ❌ 悪い例
create_table :Tasks do |t|
  t.string :Title
  t.datetime :DueDate
  t.references :Account, null: false, foreign_key: true
end
```

---

## コーディングスタイル

### インデント・スペース

```ruby
# ✅ 良い例（2スペースインデント）
def create
  validate_permissions(['write:tasks']) do
    user_id = current_user_id
    task = Task.new(task_params.merge(account_id: user_id))
    
    if task.save
      render_success(data: task, message: 'タスクが正常に作成されました', status: :created)
    else
      render_error(errors: task.errors.full_messages)
    end
  end
end

# ❌ 悪い例（4スペース、不適切な空行）
def create
    validate_permissions(['write:tasks']) do
        user_id = current_user_id
        task = Task.new(task_params.merge(account_id: user_id))


        if task.save
            render_success(data: task, message: 'タスクが正常に作成されました', status: :created)
        else
            render_error(errors: task.errors.full_messages)
        end
    end
end
```

### メソッドの長さ

```ruby
# ✅ 良い例（20行以内）
def create
  validate_permissions(['write:tasks']) do
    result = TaskService.new(current_user_id).create(task_params)
    handle_service_result(result)
  end
end

private

def handle_service_result(result)
  if result.success?
    render_success(data: result.data, message: result.message, status: result.status)
  else
    render_error(errors: result.errors, status: result.status)
  end
end

# ❌ 悪い例（長すぎるメソッド）
def create
  validate_permissions(['write:tasks']) do
    user_id = current_user_id
    task = Task.new(task_params.merge(account_id: user_id))
    
    if task.save
      # 長い処理...
      render json: { data: format_task_response(task), message: 'タスクが正常に作成されました' }, status: :created
    else
      # 長いエラー処理...
      render json: { errors: task.errors.full_messages }, status: :unprocessable_entity
    end
  end
end
```

### コメント

```ruby
# ✅ 良い例
class Task < ApplicationRecord
  # ユーザーIDに紐づくタスクを取得
  # 将来的にアーカイブ機能やソート機能を追加する際の拡張ポイント
  def self.for_user(user_id)
    by_account(user_id)
  end

  private

  # タスクの完了状態をチェック
  def completed?
    status == 'completed'
  end
end

# ❌ 悪い例（自明なコメント）
class Task < ApplicationRecord
  # タスクのタイトルを取得
  def title
    self.title
  end
end
```

---

## API設計規約

### RESTful設計

```ruby
# ✅ 良い例
GET    /api/v1/tasks           # タスク一覧取得
POST   /api/v1/tasks           # タスク作成
GET    /api/v1/tasks/:id       # タスク詳細取得
PUT    /api/v1/tasks/:id       # タスク更新
DELETE /api/v1/tasks/:id       # タスク削除

# ❌ 悪い例
GET    /api/v1/getTasks
POST   /api/v1/createTask
GET    /api/v1/task/:id
POST   /api/v1/updateTask/:id
POST   /api/v1/deleteTask/:id
```

### レスポンス形式

```ruby
# ✅ 成功レスポンス
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

# ✅ エラーレスポンス
{
  "errors": [
    "タイトルは必須です",
    "期限日は未来の日付である必要があります"
  ]
}

# ❌ 悪い例（一貫性のない形式）
{
  "task": { ... },
  "success": true,
  "error_message": null
}
```

### HTTPステータスコード

```ruby
# ✅ 適切な使用
200 OK                    # 成功
201 Created              # 作成成功
204 No Content           # 削除成功
400 Bad Request          # リクエストエラー
401 Unauthorized         # 認証エラー
403 Forbidden            # 認可エラー
404 Not Found            # リソース未発見
422 Unprocessable Entity # バリデーションエラー
500 Internal Server Error # サーバーエラー

# ❌ 悪い例
200 OK for error cases
404 for validation errors
500 for client errors
```

---

## コントローラー規約

### 抽象化レベルの判断基準

#### **シンプルな処理（コントローラーに直接記述）**
- **行数**: 5-20行程度
- **条件**: 以下のいずれかに該当
  - 基本的なCRUD操作
  - 単一のモデル操作
  - シンプルなフィルタリング
  - 基本的なバリデーション
  - 単純なレスポンス生成

#### **複雑な処理（サービス層に分離）**
- **行数**: 21行以上
- **条件**: 以下のいずれかに該当
  - 複数のモデルを跨ぐ処理
  - 外部API連携
  - バッチ処理
  - 複雑なビジネスロジック
  - トランザクション管理
  - 複雑な検索・分析
  - 通知送信
  - 再利用が必要な処理

#### **判断フローチャート**
```
処理の複雑さを評価
├─ シンプル（5-20行）
│  ├─ 基本的なCRUD？
│  │  ├─ Yes → コントローラー
│  │  └─ No → サービス層
│  └─ 単一モデル操作？
│      ├─ Yes → コントローラー
│      └─ No → サービス層
├─ 中程度（21-50行）
│  ├─ 複数モデルを跨ぐ？
│  │  ├─ Yes → サービス層
│  │  └─ No → コントローラー
│  └─ 再利用が必要？
│      ├─ Yes → サービス層
│      └─ No → コントローラー
└─ 複雑（51行以上）
    └─ サービス層に分離
```

### 基本構造

```ruby
# ✅ 良い例：シンプルな処理はコントローラーに直接記述
module Api
  module V1
    class TasksController < BaseController
      def index
        validate_permissions(['read:tasks']) do
          tasks = Task.for_user(current_user_id).includes(:category)
          tasks = apply_filters(tasks, search_params)
          
          render_success(data: tasks.map { |task| TaskSerializer.new(task).as_json })
        end
      end

      def create
        validate_permissions(['write:tasks']) do
          task = Task.new(task_params.merge(account_id: current_user_id))
          
          if task.save
            render_success(
              data: TaskSerializer.new(task).as_json,
              message: I18n.t('messages.task.created'),
              status: :created
            )
          else
            render_error(errors: task.errors.full_messages)
          end
        end
      end

      private

      def task_params
        params.require(:task).permit(:title, :due_date, :status, :priority, :category_id)
      end
    end
  end
end
```

### アクションの責任

```ruby
# ✅ 各アクションは単一の責任を持つ
def index
  # 一覧取得のみ
end

def show
  # 詳細取得のみ
end

def create
  # 作成のみ
end

def update
  # 更新のみ
end

def destroy
  # 削除のみ
end

# ❌ 悪い例（複数の責任）
def index
  # 一覧取得 + 検索 + フィルタリング + ソート
end
```

### パラメータ処理

```ruby
# ✅ 良い例
private

def task_params
  params.require(:task).permit(:title, :due_date, :status, :priority, :category_id)
end

def search_params
  params.permit(:q, :status, :priority, :category_id, :page, :per_page)
end

# ❌ 悪い例
def create
  # パラメータ処理がアクション内に直接記述
  title = params[:task][:title]
  due_date = params[:task][:due_date]
  # ...
end
```

---

## モデル規約

### 基本構造

```ruby
# ✅ 良い例
class Task < ApplicationRecord
  belongs_to :category, optional: true

  validates :title, presence: true, length: { maximum: 255 }
  validates :account_id, presence: true
  validates :status, inclusion: { in: %w[未着手 進行中 完了 保留] }, allow_nil: true
  validates :priority, inclusion: { in: %w[low medium high] }, allow_nil: true

  scope :by_account, ->(account_id) { where(account_id: account_id) }
  scope :by_status, ->(status) { where(status: status) }
  scope :overdue, -> { where('due_date < ?', Time.current) }

  def self.for_user(user_id)
    by_account(user_id)
  end

  def overdue?
    due_date.present? && due_date < Time.current
  end

  private

  def set_default_status
    self.status ||= '未着手'
  end
end
```

### バリデーション

```ruby
# ✅ 良い例
validates :title, presence: true, length: { maximum: 255 }
validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }
validates :status, inclusion: { in: %w[未着手 進行中 完了 保留] }
validates :name, uniqueness: { scope: :account_id, message: '同じカテゴリ名が既に存在します' }

# カスタムバリデーション
validate :due_date_must_be_future, if: :due_date?

private

def due_date_must_be_future
  return unless due_date.present? && due_date <= Time.current

  errors.add(:due_date, 'は未来の日付である必要があります')
end

# ❌ 悪い例
validates :title, presence: true, length: { maximum: 255 }, format: { with: /\A.+\z/ }
validates :status, presence: true, inclusion: { in: %w[未着手 進行中 完了 保留] }, allow_nil: true
```

### スコープ

```ruby
# ✅ 良い例
scope :by_account, ->(account_id) { where(account_id: account_id) }
scope :by_status, ->(status) { where(status: status) }
scope :overdue, -> { where('due_date < ?', Time.current) }
scope :due_today, -> { where(due_date: Date.current.beginning_of_day..Date.current.end_of_day) }

# 複雑なスコープはクラスメソッドで
def self.search(query)
  where('title ILIKE ?', "%#{query}%")
end

# ❌ 悪い例
scope :by_account_and_status, ->(account_id, status) { where(account_id: account_id, status: status) }
scope :complex_query, -> { joins(:category).where('categories.name = ?', 'Work').order(:created_at) }
```

---

## サービス層規約

### 抽象化レベルの判断基準

#### **サービス層に記述すべき処理**
- **行数**: 21行以上
- **条件**: 以下のいずれかに該当
  - 複数のモデルを跨ぐ処理
  - 外部API連携
  - バッチ処理
  - 複雑なビジネスロジック
  - トランザクション管理
  - 複雑な検索・分析
  - 通知送信
  - 再利用が必要な処理

#### **サービス層に記述すべきでない処理**
- **行数**: 5-20行程度
- **条件**: 以下のいずれかに該当
  - 基本的なCRUD操作
  - 単一のモデル操作
  - シンプルなフィルタリング
  - 基本的なバリデーション
  - 単純なレスポンス生成

### 基本構造

```ruby
# ✅ 良い例：複雑なビジネスロジックのみをサービス層に配置
class TaskService < BaseService
  def initialize(user_id)
    @user_id = user_id
  end

  # 複雑な処理：バッチ作成
  def bulk_create(tasks_params)
    results = []
    errors = []

    tasks_params.each_with_index do |params, index|
      task = Task.new(params.merge(account_id: @user_id))
      
      if task.save
        results << TaskSerializer.new(task).as_json
      else
        errors << { index: index, errors: task.errors.full_messages }
      end
    end

    if errors.empty?
      ServiceResult.success(data: results, message: "#{results.count}件のタスクを作成しました")
    else
      ServiceResult.error(errors: errors, message: "一部のタスクの作成に失敗しました")
    end
  end

  # 複雑な処理：検索と分析
  def search_with_analytics(query, filters = {})
    tasks = Task.for_user(@user_id)
    tasks = apply_advanced_filters(tasks, filters)
    tasks = tasks.search(query) if query.present?
    
    analytics = {
      total_count: tasks.count,
      by_status: tasks.group(:status).count,
      by_priority: tasks.group(:priority).count,
      overdue_count: tasks.overdue.count
    }
    
    ServiceResult.success(
      data: {
        tasks: tasks.map { |task| TaskSerializer.new(task).as_json },
        analytics: analytics
      }
    )
  end

  private

  def apply_advanced_filters(tasks, filters)
    tasks = tasks.by_status(filters[:status]) if filters[:status].present?
    tasks = tasks.overdue if filters[:overdue] == 'true'
    tasks = tasks.due_today if filters[:due_today] == 'true'
    tasks = tasks.where('created_at >= ?', filters[:created_after]) if filters[:created_after].present?
    tasks = tasks.where('created_at <= ?', filters[:created_before]) if filters[:created_before].present?
    tasks
  end
end
```

### ServiceResult パターン

```ruby
# ✅ 良い例
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
```

---

## テスト規約

### 基本構造

```ruby
# ✅ 良い例
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
      expect(json_response['data']).to be_an(Array)
      expect(json_response['data'].first['id']).to eq(task.id)
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
      expect(json_response['message']).to eq('タスクが正常に作成されました')
    end

    it '無効なパラメータでエラーが返される' do
      post '/api/v1/tasks', params: { task: { title: '' } }
      
      expect(response).to have_http_status(:unprocessable_entity)
      expect(json_response['errors']).to include('タイトルは必須です')
    end
  end
end
```

### テストの命名

```ruby
# ✅ 良い例
describe 'GET /api/v1/tasks' do
  it 'タスク一覧を取得できる'
  it '認証されていない場合は401エラーが返される'
  it '権限がない場合は403エラーが返される'
end

describe 'POST /api/v1/tasks' do
  context '有効なパラメータの場合' do
    it 'タスクを作成できる'
    it '作成されたタスクの情報が返される'
  end

  context '無効なパラメータの場合' do
    it 'バリデーションエラーが返される'
    it 'タスクは作成されない'
  end
end

# ❌ 悪い例
describe 'GET /api/v1/tasks' do
  it 'works'
  it 'returns tasks'
  it 'test'
end
```

### ファクトリー

```ruby
# ✅ 良い例
FactoryBot.define do
  factory :task do
    sequence(:account_id) { |n| "user-#{n}" }
    sequence(:title) { |n| "タスク #{n}" }
    due_date { 1.week.from_now }
    status { '未着手' }
    priority { 'medium' }
    category_id { nil }

    trait :completed do
      status { '完了' }
    end

    trait :overdue do
      due_date { 1.day.ago }
    end

    trait :with_category do
      association :category
    end
  end
end

# ❌ 悪い例
FactoryBot.define do
  factory :task do
    account_id { 'user-1' }
    title { 'タスク' }
    due_date { Date.current }
    status { '未着手' }
    priority { 'medium' }
    category_id { 1 }
  end
end
```

---

## セキュリティ規約

### 認証・認可

```ruby
# ✅ 良い例
def create
  validate_permissions(['write:tasks']) do
    # 処理
  end
end

# リソースの所有者チェック
def show
  task = Task.find_by(id: params[:id], account_id: current_user_id)
  return render_not_found('タスク') unless task
  # 処理
end

# ❌ 悪い例
def create
  # 認証チェックなし
  # 処理
end

def show
  task = Task.find(params[:id]) # 所有者チェックなし
  # 処理
end
```

### パラメータ処理

```ruby
# ✅ 良い例
def task_params
  params.require(:task).permit(:title, :due_date, :status, :priority, :category_id)
end

# ❌ 悪い例
def task_params
  params.require(:task).permit! # 全パラメータを許可
end
```

### SQLインジェクション対策

```ruby
# ✅ 良い例
scope :search, ->(query) { where('title ILIKE ?', "%#{query}%") }

# ❌ 悪い例
scope :search, ->(query) { where("title ILIKE '%#{query}%'") }
```

---

## パフォーマンス規約

### N+1問題の回避

```ruby
# ✅ 良い例
def index
  tasks = Task.for_user(current_user_id).includes(:category)
  render_success(data: tasks.map { |task| TaskSerializer.new(task).as_json })
end

# ❌ 悪い例
def index
  tasks = Task.for_user(current_user_id)
  render_success(data: tasks.map { |task| format_task_response(task) }) # N+1問題
end
```

### インデックスの活用

```ruby
# ✅ 良い例
# マイグレーション
add_index :tasks, :account_id
add_index :tasks, [:account_id, :status]
add_index :tasks, [:account_id, :due_date]

# クエリ
Task.where(account_id: user_id, status: '未着手')
Task.where(account_id: user_id).where('due_date < ?', Time.current)

# ❌ 悪い例
# インデックスなしでクエリ
Task.where(account_id: user_id, status: '未着手') # インデックスなし
```

### キャッシュの活用

```ruby
# ✅ 良い例
def index
  cache_key = "tasks:#{current_user_id}:#{params[:page]}"
  tasks = Rails.cache.fetch(cache_key, expires_in: 5.minutes) do
    Task.for_user(current_user_id).includes(:category).to_a
  end
  render_success(data: tasks.map { |task| TaskSerializer.new(task).as_json })
end
```

---

## エラーハンドリング規約

### 統一されたエラーレスポンス

```ruby
# ✅ 良い例
class BaseController < ApplicationController
  private

  def render_success(data: nil, message: nil, status: :ok)
    response = {}
    response[:data] = data if data
    response[:message] = message if message
    render json: response, status: status
  end

  def render_error(errors:, status: :unprocessable_entity)
    render json: { errors: errors }, status: status
  end

  def render_not_found(resource_name)
    render json: { errors: ["#{resource_name}が見つかりません"] }, status: :not_found
  end
end

# ❌ 悪い例
def create
  if task.save
    render json: { success: true, data: task }
  else
    render json: { success: false, errors: task.errors.full_messages }
  end
end
```

### 例外処理

```ruby
# ✅ 良い例
def create
  validate_permissions(['write:tasks']) do
    result = TaskService.new(current_user_id).create(task_params)
    handle_service_result(result)
  end
rescue StandardError => e
  Rails.logger.error "Task creation failed: #{e.message}"
  render_error(errors: ['内部サーバーエラーが発生しました'], status: :internal_server_error)
end

# ❌ 悪い例
def create
  # 例外処理なし
  result = TaskService.new(current_user_id).create(task_params)
  handle_service_result(result)
end
```

---

## 国際化（i18n）規約

### エラーメッセージ

```ruby
# ✅ 良い例
# config/locales/ja.yml
ja:
  activerecord:
    errors:
      models:
        task:
          attributes:
            title:
              blank: "タイトルは必須です"
              too_long: "タイトルは%{count}文字以内で入力してください"

# モデル
validates :title, presence: true, length: { maximum: 255 }

# ❌ 悪い例
validates :title, presence: { message: 'タイトルは必須です' }
```

### レスポンスメッセージ

```ruby
# ✅ 良い例
# config/locales/ja.yml
ja:
  messages:
    task:
      created: "タスクが正常に作成されました"
      updated: "タスクが正常に更新されました"
      deleted: "タスクが正常に削除されました"

# コントローラー
render_success(message: I18n.t('messages.task.created'))

# ❌ 悪い例
render_success(message: 'タスクが正常に作成されました')
```

---

## Git規約

### コミットメッセージ

```
# ✅ 良い例
feat: タスク作成APIにバリデーションを追加
fix: タスク一覧APIのN+1問題を修正
docs: API仕様書を更新
refactor: TaskServiceをリファクタリング
test: タスクコントローラーのテストを追加

# ❌ 悪い例
update
fix
changes
work
```

### ブランチ命名

```
# ✅ 良い例
feature/task-validation
fix/n-plus-one-query
refactor/task-service
docs/api-specification

# ❌ 悪い例
new-feature
fix
work
update
```

---

## まとめ

このコーディング規約に従うことで、以下の効果が期待できます：

- **保守性の向上**: 一貫したコードスタイルにより、理解しやすいコード
- **品質の向上**: ベストプラクティスに基づく堅牢な実装
- **開発効率の向上**: 明確な規約により、迷いのない開発
- **チーム開発の円滑化**: 統一された規約による協力の促進

規約は定期的に見直し、プロジェクトの成長に合わせて更新していきます。
