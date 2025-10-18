# サービス層（Service Layer）

## 📋 概要

サービス層は、複雑なビジネスロジックを処理する層です。
コントローラー層とモデル層の間に位置し、アプリケーションの核となるビジネスルールを実装します。

## 🎯 責任範囲

### **主要な責任**
- 複雑なビジネスロジックの実装
- 複数のモデルを跨ぐ処理
- 外部API連携
- バッチ処理
- トランザクション管理
- 複雑な検索・分析処理

### **責任外**
- HTTPリクエストの処理（コントローラー層の責任）
- データベースの直接操作（モデル層の責任）
- レスポンスデータの整形（シリアライザー層の責任）

## 🏗️ アーキテクチャ

### **基本構造**
```
app/services/
├── base_service.rb           # 基底サービス
├── task_service.rb          # タスクサービス
├── category_service.rb      # カテゴリサービス
└── notification_service.rb  # 通知サービス
```

### **継承関係**
```
BaseService
    ↓
TaskService (具体的なビジネスロジック)
```

## 💻 実装例

### **基本的なサービス**
```ruby
class TaskService < BaseService
  def initialize(user_id)
    @user_id = user_id
  end

  # 複雑なビジネスロジックのみをサービス層に配置
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

  def search_with_analytics(query, filters = {})
    # 複雑な検索ロジック
    tasks = Task.for_user(@user_id)
    tasks = apply_advanced_filters(tasks, filters)
    tasks = tasks.search(query) if query.present?
    
    # 検索結果の分析
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

## 📏 適切な抽象化レベル

### **サービス層に記述すべき処理**
- **複雑なビジネスロジック**（21行以上）
- **複数のモデルを跨ぐ処理**
- **外部API連携**
- **バッチ処理**
- **複雑な検索・分析**
- **トランザクション管理**
- **通知送信**

### **サービス層に記述すべきでない処理**
- **シンプルなCRUD操作**（コントローラー層で十分）
- **基本的なフィルタリング**（コントローラー層で十分）
- **単純なデータ取得**（コントローラー層で十分）

## 🔧 共通機能

### **BaseService**
```ruby
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

## 🧪 テスト

### **テストの基本構造**
```ruby
RSpec.describe TaskService do
  let(:user_id) { 'test-user-id' }
  let(:service) { described_class.new(user_id) }

  describe '#bulk_create' do
    it '複数のタスクを作成できる' do
      tasks_params = [
        { title: 'タスク1', status: '未着手' },
        { title: 'タスク2', status: '進行中' }
      ]

      result = service.bulk_create(tasks_params)

      expect(result.success?).to be true
      expect(result.data.count).to eq(2)
      expect(result.message).to eq('2件のタスクを作成しました')
    end

    it '一部のタスクの作成に失敗した場合、エラーを返す' do
      tasks_params = [
        { title: 'タスク1', status: '未着手' },
        { title: '', status: '進行中' } # 無効なデータ
      ]

      result = service.bulk_create(tasks_params)

      expect(result.error?).to be true
      expect(result.errors).to be_present
    end
  end
end
```

## 📊 パフォーマンス考慮事項

### **バッチ処理の最適化**
```ruby
# ✅ 良い例：バッチ処理でパフォーマンスを向上
def bulk_create(tasks_params)
  results = []
  errors = []

  # トランザクション内で一括処理
  ActiveRecord::Base.transaction do
    tasks_params.each_with_index do |params, index|
      task = Task.new(params.merge(account_id: @user_id))
      
      if task.save
        results << TaskSerializer.new(task).as_json
      else
        errors << { index: index, errors: task.errors.full_messages }
      end
    end
  end

  # 結果の処理
end
```

### **N+1問題の回避**
```ruby
# ✅ 良い例：includesでN+1問題を回避
def search_with_analytics(query, filters = {})
  tasks = Task.for_user(@user_id).includes(:category)
  # 処理...
end
```

## 🚫 避けるべきパターン

### **過度な抽象化**
```ruby
# ❌ 悪い例：シンプルな処理でも過度に抽象化
class TaskService < BaseService
  def create(params)
    # シンプルなCRUD操作をサービス層に配置
    task = Task.new(params.merge(account_id: @user_id))
    
    if task.save
      ServiceResult.success(data: TaskSerializer.new(task).as_json)
    else
      ServiceResult.error(errors: task.errors.full_messages)
    end
  end
end
```

### **Fat Service（太ったサービス）**
```ruby
# ❌ 悪い例：一つのサービスに全ての処理を集約
class TaskService < BaseService
  def create; end
  def update; end
  def destroy; end
  def list; end
  def search; end
  def bulk_create; end
  def send_notifications; end
  def generate_report; end
  # 100個のメソッド...
end
```

## ✅ ベストプラクティス

1. **単一責任の原則**: 各サービスは特定のドメインに集中
2. **適切な抽象化**: 複雑な処理のみをサービス層に配置
3. **ServiceResultパターン**: 統一された戻り値
4. **エラーハンドリング**: 適切なログ出力とエラー処理
5. **テスト**: 包括的なテストカバレッジ
6. **パフォーマンス**: バッチ処理とN+1問題の回避
7. **再利用性**: 複数の場所から呼び出し可能

## 🔄 他の層との連携

### **コントローラー層との連携**
```ruby
# コントローラーからサービスの呼び出し
def bulk_create
  validate_permissions(['write:tasks']) do
    result = TaskService.new(current_user_id).bulk_create(tasks_params)
    handle_service_result(result)
  end
end
```

### **モデル層との連携**
```ruby
# サービス内でのモデルの使用
def search_with_analytics(query, filters = {})
  tasks = Task.for_user(@user_id)  # モデル層の活用
  tasks = apply_advanced_filters(tasks, filters)
  # 処理...
end
```

## 📚 関連ドキュメント

- [コントローラー層の説明](LAYER_CONTROLLER.md)
- [モデル層の説明](LAYER_MODEL.md)
- [シリアライザー層の説明](LAYER_SERIALIZER.md)
- [アーキテクチャガイド](../ARCHITECTURE_GUIDE.md)
- [コーディング規約](../CODING_STANDARDS.md)
