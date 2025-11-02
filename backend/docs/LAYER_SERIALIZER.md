# シリアライザー層（Serializer Layer）

## 概要

シリアライザー層は、モデルオブジェクトをJSON形式に変換する責任を担います。APIレスポンスの一貫性を保ち、フロントエンドが必要とする形式でデータを提供します。

## データ形式の規約

### **キャメルケース変換の必須化**

**重要**: バックエンドは、フロントエンド側に**キャメルケース（camelCase）**の状態でデータを返すことが必須です。

- **データベース**: snake_case（`account_id`, `due_date`, `created_at`など）
- **Rubyコード**: snake_case（変数名、メソッド名など）
- **APIレスポンス**: camelCase（`accountId`, `dueDate`, `createdAt`など）

この変換は**シリアライザー層**で実施します。

### 変換規則

```ruby
# 変換例
account_id    → accountId
due_date      → dueDate
created_at    → createdAt
updated_at    → updatedAt
category_id   → categoryId
is_active     → isActive
last_generated_at → lastGeneratedAt
```

## 責任範囲

### ✅ **シリアライザー層が担当すべき処理**

1. **データ変換**
   - モデルオブジェクトからJSONへの変換
   - 属性名の変換（snake_case → camelCase）**（必須）**
   - 日付・時刻のフォーマット

2. **レスポンス構造の統一**
   - 一貫したJSON構造の提供
   - 必要な属性のみの公開
   - 計算された属性の追加

3. **バージョン管理**
   - APIバージョンごとの形式対応
   - 後方互換性の維持
   - 段階的な移行のサポート

4. **セキュリティ**
   - 機密情報の除外
   - 適切な権限に基づく表示制御

### ❌ **シリアライザー層が担当すべきでない処理**

1. **ビジネスロジック**
2. **データベース操作**
3. **認証・認可**
4. **外部API連携**
5. **複雑な計算処理**

## 実装例

### 基本的なシリアライザー構造

```ruby
class TaskSerializer < BaseSerializer
  def as_json
    {
      id: @object.id,
      accountId: @object.account_id,
      title: @object.title,
      dueDate: @object.due_date&.iso8601,
      status: @object.status,
      priority: @object.priority,
      categoryId: @object.category_id,
      categoryName: @object.category&.name,
      overdue: @object.overdue?,
      completed: @object.completed?,
      createdAt: @object.created_at.iso8601(3),
      updatedAt: @object.updated_at.iso8601(3)
    }
  end
end
```

### ベースシリアライザー

```ruby
class BaseSerializer
  def initialize(object)
    @object = object
  end

  def as_json(_options = {})
    raise NotImplementedError, "Subclasses must implement the 'as_json' method."
  end

  protected

  def format_date(date)
    date&.iso8601
  end

  def format_datetime(datetime)
    datetime&.iso8601(3)
  end

  def camelize_key(key)
    key.to_s.camelize(:lower)
  end
end
```

### 条件付きシリアライゼーション

```ruby
class TaskSerializer < BaseSerializer
  def as_json(options = {})
    base_attributes.merge(conditional_attributes(options))
  end

  private

  def base_attributes
    {
      id: @object.id,
      title: @object.title,
      status: @object.status,
      priority: @object.priority,
      createdAt: format_datetime(@object.created_at),
      updatedAt: format_datetime(@object.updated_at)
    }
  end

  def conditional_attributes(options)
    attributes = {}
    
    if options[:include_details]
      attributes.merge!(
        accountId: @object.account_id,
        dueDate: format_date(@object.due_date),
        categoryId: @object.category_id,
        categoryName: @object.category&.name
      )
    end

    if options[:include_computed]
      attributes.merge!(
        overdue: @object.overdue?,
        completed: @object.completed?,
        inProgress: @object.in_progress?,
        pending: @object.pending?
      )
    end

    attributes
  end
end
```

### コレクション用シリアライザー

```ruby
class TaskCollectionSerializer < BaseSerializer
  def initialize(tasks)
    @tasks = tasks
  end

  def as_json(options = {})
    {
      tasks: @tasks.map { |task| TaskSerializer.new(task).as_json(options) },
      meta: {
        total: @tasks.count,
        page: options[:page] || 1,
        perPage: options[:per_page] || 25
      }
    }
  end
end
```

### 習慣化タスクシリアライザーの例

```ruby
class RoutineTaskSerializer < BaseSerializer
  def as_json
    {
      id: @object.id,
      accountId: @object.account_id,
      title: @object.title,
      frequency: @object.frequency,
      intervalValue: @object.interval_value,
      lastGeneratedAt: format_datetime(@object.last_generated_at),
      nextGenerationAt: format_datetime(@object.next_generation_at),
      maxActiveTasks: @object.max_active_tasks,
      categoryId: @object.category_id,
      categoryName: @object.category&.name,
      priority: @object.priority,
      isActive: @object.is_active,
      dueDateOffsetDays: @object.due_date_offset_days,
      dueDateOffsetHour: @object.due_date_offset_hour,
      startGenerationAt: format_datetime(@object.start_generation_at),
      createdAt: format_datetime(@object.created_at),
      updatedAt: format_datetime(@object.updated_at)
    }
  end
end
```

### マイルストーンシリアライザーの例

```ruby
class MilestoneSerializer < BaseSerializer
  def as_json
    stats = @object.task_statistics
    {
      id: @object.id,
      accountId: @object.account_id,
      name: @object.name,
      description: @object.description,
      startDate: format_date(@object.start_date),
      dueDate: format_date(@object.due_date),
      status: @object.status,
      completedAt: format_datetime(@object.completed_at),
      progressPercentage: stats[:progress_percentage],
      totalTasksCount: stats[:total_tasks_count],
      completedTasksCount: stats[:completed_tasks_count],
      createdAt: format_datetime(@object.created_at),
      updatedAt: format_datetime(@object.updated_at),
      tasks: @object.tasks.map { |task| TaskSerializer.new(task).as_json }
    }
  end
end
```

**特徴**:
- 進捗統計情報を`task_statistics`メソッドから取得
- 関連するタスクも含めてシリアライズ
- 計算された属性（progressPercentage）を含む

## 設計原則

### 1. **一貫性**
- 同じ属性は常に同じ形式で出力
- 命名規則の統一（camelCase）
- 日付・時刻の統一フォーマット

### 2. **シンプルさ**
- 必要最小限の属性のみを公開
- 複雑な変換ロジックは避ける
- 直感的な構造

### 3. **拡張性**
- 新しい属性の追加が容易
- バージョン管理の考慮
- オプションによる柔軟性

### 4. **パフォーマンス**
- 不要な計算を避ける
- メモ化の活用
- 効率的なデータ変換

## テスト

### シリアライザーテストの例

```ruby
RSpec.describe TaskSerializer do
  let(:category) { create(:category, name: 'テストカテゴリ') }
  let(:task) do
    create(:task,
           title: 'テストタスク',
           due_date: 1.week.from_now,
           status: '未着手',
           priority: 'medium',
           category: category)
  end
  let(:serializer) { described_class.new(task) }

  describe '#as_json' do
    it '正しい形式でシリアライズされる' do
      result = serializer.as_json

      expect(result).to include(
        id: task.id,
        accountId: task.account_id,
        title: 'テストタスク',
        status: '未着手',
        priority: 'medium',
        categoryId: category.id,
        categoryName: 'テストカテゴリ'
      )
    end

    it '日付が正しい形式でフォーマットされる' do
      result = serializer.as_json

      expect(result[:dueDate]).to eq(task.due_date.iso8601)
      expect(result[:createdAt]).to eq(task.created_at.iso8601(3))
      expect(result[:updatedAt]).to eq(task.updated_at.iso8601(3))
    end

    it 'due_dateがnilの場合も正しく処理される' do
      task.update!(due_date: nil)
      result = serializer.as_json

      expect(result[:dueDate]).to be_nil
    end

    it 'カテゴリがない場合も正しく処理される' do
      task.update!(category: nil)
      result = serializer.as_json

      expect(result[:categoryId]).to be_nil
      expect(result[:categoryName]).to be_nil
    end

    it '計算された属性が正しく含まれる' do
      task.update!(due_date: 1.day.ago, status: '完了')
      result = serializer.as_json

      expect(result[:overdue]).to be true
      expect(result[:completed]).to be true
    end
  end
end
```

## ベストプラクティス

1. **命名規則の統一（必須）**
   - **フロントエンドに合わせてキャメルケース（camelCase）で返すこと**
   - すべての属性名をsnake_caseからcamelCaseに変換
   - 一貫した変換ルールの適用
   - 新しい属性を追加する際も必ずキャメルケースで返す

2. **パフォーマンスの考慮**
   - 不要な属性の計算を避ける
   - メモ化の適切な活用

3. **エラーハンドリング**
   - nil値の適切な処理
   - 例外の適切な捕捉

4. **テストの充実**
   - 様々な条件でのテスト
   - エッジケースの考慮

5. **ドキュメント化**
   - シリアライザーの仕様を明確化
   - 変更履歴の管理
