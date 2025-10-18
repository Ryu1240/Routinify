# コントローラー層（Controller Layer）

## 📋 概要

コントローラー層は、HTTPリクエストの処理とレスポンスの生成を担当する層です。
Rails APIアプリケーションにおいて、クライアントとアプリケーションの入り口となる重要な層です。

## 🎯 責任範囲

### **主要な責任**
- HTTPリクエストの受信とパラメータの処理
- 認証・認可のチェック
- ビジネスロジックの呼び出し（必要に応じて）
- レスポンスの生成と返却
- エラーハンドリング

### **責任外**
- 複雑なビジネスロジック（サービス層に委譲）
- データベースの直接操作（モデル層に委譲）
- レスポンスデータの整形（シリアライザー層に委譲）

## 🏗️ アーキテクチャ

### **基本構造**
```
app/controllers/
├── api/
│   └── v1/
│       ├── base_controller.rb      # 共通コントローラー
│       ├── tasks_controller.rb     # タスクコントローラー
│       └── categories_controller.rb # カテゴリコントローラー
├── concerns/
│   ├── error_handler.rb            # エラーハンドリング
│   └── response_formatter.rb       # レスポンス整形
└── application_controller.rb       # 基底コントローラー
```

### **継承関係**
```
ApplicationController
    ↓
BaseController (API共通処理)
    ↓
TasksController (具体的なエンドポイント)
```

## 💻 実装例

### **基本的なコントローラー**
```ruby
module Api
  module V1
    class TasksController < BaseController
      def index
        validate_permissions(['read:tasks']) do
          # シンプルな処理はコントローラーに直接記述
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

      def search_params
        params.permit(:status, :overdue, :due_today, :q, :page, :per_page)
      end

      def apply_filters(tasks, filters)
        tasks = tasks.by_status(filters[:status]) if filters[:status].present?
        tasks = tasks.overdue if filters[:overdue] == 'true'
        tasks = tasks.due_today if filters[:due_today] == 'true'
        tasks = tasks.search(filters[:q]) if filters[:q].present?
        tasks
      end
    end
  end
end
```

## 📏 適切な抽象化レベル

### **コントローラーに記述すべき処理**
- **シンプルなCRUD操作**（5-20行程度）
- **基本的なフィルタリング**
- **パラメータの検証**
- **認証・認可チェック**
- **レスポンスの生成**

### **コントローラーに記述すべきでない処理**
- **複雑なビジネスロジック**（21行以上）
- **外部API連携**
- **バッチ処理**
- **複雑なデータ変換**
- **複数のモデルを跨ぐ処理**

## 🔧 共通機能

### **BaseController**
```ruby
module Api
  module V1
    class BaseController < ApplicationController
      include ErrorHandler
      include ResponseFormatter

      before_action :set_pagination_params

      private

      def render_success(data: nil, message: nil, status: :ok)
        response = { success: true }
        response[:data] = data if data
        response[:message] = message if message
        render json: response, status: status
      end

      def render_error(errors:, status: :unprocessable_entity)
        render json: { success: false, errors: errors }, status: status
      end

      def render_not_found(resource_name)
        render json: { success: false, errors: ["#{resource_name}が見つかりません"] }, status: :not_found
      end
    end
  end
end
```

### **ErrorHandler Concern**
```ruby
module ErrorHandler
  extend ActiveSupport::Concern

  included do
    rescue_from StandardError, with: :handle_standard_error
    rescue_from ActiveRecord::RecordNotFound, with: :handle_record_not_found
    rescue_from ActiveRecord::RecordInvalid, with: :handle_record_invalid
  end

  private

  def handle_standard_error(exception)
    Rails.logger.error "Unexpected error: #{exception.message}"
    render json: { success: false, errors: ['内部サーバーエラーが発生しました'] }, status: :internal_server_error
  end
end
```

## 🧪 テスト

### **テストの基本構造**
```ruby
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
    end
  end
end
```

## 📊 パフォーマンス考慮事項

### **N+1問題の回避**
```ruby
# ✅ 良い例
tasks = Task.for_user(current_user_id).includes(:category)

# ❌ 悪い例
tasks = Task.for_user(current_user_id)
tasks.each { |task| puts task.category.name } # N+1問題
```

### **適切なHTTPステータスコード**
- `200 OK` - 成功
- `201 Created` - 作成成功
- `204 No Content` - 削除成功
- `400 Bad Request` - リクエストエラー
- `401 Unauthorized` - 認証エラー
- `403 Forbidden` - 認可エラー
- `404 Not Found` - リソース未発見
- `422 Unprocessable Entity` - バリデーションエラー
- `500 Internal Server Error` - サーバーエラー

## 🚫 避けるべきパターン

### **Fat Controller（太ったコントローラー）**
```ruby
# ❌ 悪い例：コントローラーにビジネスロジックが集中
def create
  # 100行の複雑なビジネスロジック
  # 外部API呼び出し
  # 複雑なデータ変換
  # 通知送信
  # など...
end
```

### **過度な抽象化**
```ruby
# ❌ 悪い例：シンプルな処理でも過度に抽象化
def show
  result = TaskService.new(current_user_id).find(params[:id])
  handle_service_result(result)
end
```

## ✅ ベストプラクティス

1. **単一責任の原則**: 各アクションは一つの責任のみ
2. **DRY原則**: 重複コードを避ける
3. **適切な抽象化**: 必要に応じてサービス層を活用
4. **エラーハンドリング**: 統一されたエラー処理
5. **テスト**: 包括的なテストカバレッジ
6. **パフォーマンス**: N+1問題の回避
7. **セキュリティ**: 適切な認証・認可

## 📚 関連ドキュメント

- [サービス層の説明](LAYER_SERVICE.md)
- [モデル層の説明](LAYER_MODEL.md)
- [シリアライザー層の説明](LAYER_SERIALIZER.md)
- [アーキテクチャガイド](../ARCHITECTURE_GUIDE.md)
- [コーディング規約](../CODING_STANDARDS.md)
