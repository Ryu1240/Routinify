# データベーススキーマ設計書

**最終更新日**: 2025-11-01
**バージョン**: 2.2.0

## 概要

このドキュメントは、Routinifyバックエンドのデータベーススキーマ設計を記載しています。

### スキーマ管理

- **管理ツール**: Ridgepole
- **スキーマ定義**: `db/Schemafile`
- **テーブル定義**: `db/schemas/` ディレクトリ
- **変更方法**: [DEVELOPMENT_GUIDE.md](../DEVELOPMENT_GUIDE.md#ridgepoleによるスキーマ管理) を参照

---

## テーブル一覧

| テーブル名 | 説明 | 実装状況 |
|-----------|------|---------|
| tasks | タスク情報を管理 | ✅ 実装済み |
| categories | タスクのカテゴリを管理 | ✅ 実装済み |
| routine_tasks | 習慣化タスクのテンプレートを管理 | ✅ 実装済み |
| milestones | マイルストーン情報を管理 | ⚠️ スキーマのみ |
| milestone_tasks | タスクとマイルストーンの関連付け | ⚠️ スキーマのみ |

---

## ER図

```
┌──────────────────────┐
│   routine_tasks      │ (習慣化タスクテンプレート)
├──────────────────────┤
│ id (PK)              │
│ account_id           │
│ title                │
│ frequency            │
│ interval_value       │
│ last_generated_at    │
│ next_generation_at   │
│ max_active_tasks     │
│ category_id (FK)     │──┐
│ priority             │  │
│ is_active            │  │
│ created_at           │  │
│ updated_at           │  │
└──────────────────────┘  │
         │                │
         │ 1:N            │
         ▼                │
┌──────────────────┐      │       ┌─────────────┐
│      tasks       │      │       │ categories  │
├──────────────────┤      │       ├─────────────┤
│ id (PK)          │      │       │ id (PK)     │
│ account_id       │      └──────►│ account_id  │
│ title            │              │ name        │
│ due_date         │              │ created_at  │
│ status           │              │ updated_at  │
│ priority         │              └─────────────┘
│ category_id (FK) │──────────────────┘
│ routine_task_id  │
│ generated_at     │
│ created_at       │
│ updated_at       │
└──────────────────┘
```

---

## テーブル詳細

### tasks

**説明**: タスク情報を管理するメインテーブル。通常タスクと習慣タスクから生成されたタスクの両方を格納。

#### カラム

| カラム名 | 型 | NULL | 説明 |
|---------|---|------|------|
| id | integer | NO | 主キー |
| account_id | string(255) | YES | Auth0のユーザーID |
| title | string(255) | YES | タスク名 |
| due_date | date | YES | 期限日 |
| status | string(50) | YES | pending, in_progress, completed, on_hold |
| priority | string(50) | YES | low, medium, high |
| category_id | integer | YES | カテゴリID（外部キー） |
| **routine_task_id** | **integer** | **YES** | **習慣タスクID（NULL=通常タスク）** |
| **generated_at** | **datetime** | **YES** | **習慣タスクから生成された日時** |
| created_at | datetime | YES | レコード作成日時 |
| updated_at | datetime | YES | 更新日時 |

#### generated_at と created_at の違い

- **generated_at**: 習慣タスクから「論理的に生成すべき日時」
- **created_at**: データベースに「物理的に登録された日時」
- **目的**: 非同期ジョブの遅延検知、正確な削除順序の実現

#### インデックス

```ruby
add_index 'tasks', ['category_id']
add_index 'tasks', ['routine_task_id', 'status', 'generated_at']
```

#### 外部キー

```ruby
add_foreign_key 'tasks', 'categories', on_delete: :nullify
add_foreign_key 'tasks', 'routine_tasks', on_delete: :nullify
```

#### モデル

```ruby
class Task < ApplicationRecord
  include AccountScoped

  belongs_to :category, optional: true
  belongs_to :routine_task, optional: true

  validates :title, presence: true, length: { maximum: 255 }
  validates :account_id, presence: true
  validates :status, inclusion: { in: %w[pending in_progress completed on_hold] }, allow_nil: true
  validates :priority, inclusion: { in: %w[low medium high] }, allow_nil: true
  validates :due_date, future_date: { allow_past: true }, allow_nil: true

  scope :by_account, ->(account_id) { where(account_id: account_id) }
  scope :by_status, ->(status) { where(status: status) }
  scope :overdue, -> { where('due_date < ?', Time.current) }
  scope :due_today, -> { where(due_date: Date.current.beginning_of_day..Date.current.end_of_day) }

  def self.for_user(user_id)
    by_account(user_id)
  end

  def self.search(query)
    where('title ILIKE ?', "%#{query}%")
  end

  def overdue?
    due_date.present? && due_date < Time.current
  end

  def completed?
    status == 'completed'
  end
end
```

---

### categories

**説明**: タスクを分類するためのカテゴリ情報を管理。

#### カラム

| カラム名 | 型 | NULL | 説明 |
|---------|---|------|------|
| id | integer | NO | 主キー |
| account_id | string(255) | YES | Auth0のユーザーID |
| name | string(255) | YES | カテゴリ名 |
| created_at | datetime | YES | 作成日時 |
| updated_at | datetime | YES | 更新日時 |

#### モデル

```ruby
class Category < ApplicationRecord
  has_many :tasks, dependent: :nullify
  has_many :routine_tasks, dependent: :nullify

  validates :name, presence: true, length: { maximum: 255 }
  validates :account_id, presence: true
  validates :name, uniqueness: { scope: :account_id, message: '同じカテゴリ名が既に存在します' }

  scope :by_account, ->(account_id) { where(account_id: account_id) }

  def self.for_user(user_id)
    by_account(user_id)
  end
end
```

---

### routine_tasks

**説明**: 定期的にタスクを生成するためのテンプレートを管理。

#### カラム

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|---|------|-----------|------|
| id | integer | NO | - | 主キー |
| account_id | string(255) | NO | - | Auth0のユーザーID |
| title | string(255) | NO | - | 習慣タスク名 |
| **frequency** | **string(50)** | **NO** | - | **daily, weekly, monthly, custom** |
| **interval_value** | **integer** | **YES** | **NULL** | **customの場合の日数（custom以外はNULL）** |
| **last_generated_at** | **datetime** | **YES** | **NULL** | **最終生成日時** |
| **next_generation_at** | **datetime** | **NO** | - | **次回生成日時** |
| **max_active_tasks** | **integer** | **NO** | **3** | **未完了タスクの上限** |
| category_id | integer | YES | NULL | カテゴリID（外部キー） |
| priority | string(50) | YES | NULL | low, medium, high |
| is_active | boolean | NO | true | 有効/無効フラグ |
| **due_date_offset_days** | **integer** | **YES** | **NULL** | **期限日の日数オフセット（0以上）** |
| **due_date_offset_hour** | **integer** | **YES** | **NULL** | **期限日の時オフセット（0-23）** |
| **start_generation_at** | **datetime** | **NO** | - | **開始期限（この日からタスクの生成が始まります。一度でも生成が行われると変更できません）** |
| created_at | datetime | NO | - | 作成日時 |
| updated_at | datetime | NO | - | 更新日時 |

#### frequency の値

| 値 | 説明 | interval_value |
|----|------|---------------|
| daily | 毎日 | NULL（使用しない） |
| weekly | 毎週 | NULL（使用しない） |
| monthly | 毎月 | NULL（使用しない） |
| custom | カスタム間隔 | 必須（1以上の整数、日数で指定） |

#### インデックス

```ruby
add_index 'routine_tasks', ['account_id', 'is_active']
add_index 'routine_tasks', ['next_generation_at']
add_index 'routine_tasks', ['category_id']
```

#### 外部キー

```ruby
add_foreign_key 'routine_tasks', 'categories', on_delete: :nullify
```

#### モデル

```ruby
class RoutineTask < ApplicationRecord
  has_many :tasks, dependent: :nullify
  belongs_to :category, optional: true

  FREQUENCIES = %w[daily weekly monthly custom].freeze
  PRIORITIES = %w[low medium high].freeze

  validates :account_id, presence: true
  validates :title, presence: true, length: { maximum: 255 }
  validates :frequency, presence: true, inclusion: { in: FREQUENCIES }
  validates :next_generation_at, presence: true
  validates :start_generation_at, presence: true
  validates :max_active_tasks, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 1 }
  validates :priority, inclusion: { in: PRIORITIES }, allow_nil: true
  validates :due_date_offset_days, numericality: { only_integer: true, greater_than_or_equal_to: 0 }, allow_nil: true
  validates :due_date_offset_hour, numericality: { only_integer: true, greater_than_or_equal_to: 0, less_than: 24 }, allow_nil: true
  validate :validate_interval_value_based_on_frequency
  validate :validate_start_generation_at_immutable

  scope :by_account, ->(account_id) { where(account_id: account_id) }

  def self.for_user(user_id)
    by_account(user_id)
  end

  def active_tasks_count
    tasks.where.not(status: 'completed').count
  end

  def interval_days
    case frequency
    when 'daily' then 1
    when 'weekly' then 7
    when 'monthly' then 30
    when 'custom' then interval_value || 1
    else 1
    end
  end

  def generated?
    last_generated_at.present?
  end

  def calculate_due_date(base_date)
    return nil unless base_date
    due_date = base_date.to_date.beginning_of_day
    due_date += due_date_offset_days.days if due_date_offset_days.present?
    due_date += due_date_offset_hour.hours if due_date_offset_hour.present?
    due_date
  end

  private

  def validate_interval_value_based_on_frequency
    if frequency == 'custom'
      if interval_value.blank?
        errors.add(:interval_value, 'はカスタム頻度の場合必須です')
      elsif interval_value.to_i < 1
        errors.add(:interval_value, 'は1以上である必要があります')
      end
    end
  end

  def validate_start_generation_at_immutable
    if generated? && start_generation_at_changed? && persisted?
      errors.add(:start_generation_at, 'は一度でも生成が行われると変更できません')
    end
  end
end
```

---

### milestones

**説明**: 複数のタスクをグループ化するマイルストーン機能（将来の実装予定）。

#### カラム

| カラム名 | 型 | NULL | 説明 |
|---------|---|------|------|
| id | integer | NO | 主キー |
| name | string(255) | YES | マイルストーン名 |
| due_date | date | YES | 期限日 |
| created_at | datetime | YES | 作成日時 |
| updated_at | datetime | YES | 更新日時 |

**注記**: スキーマ定義は存在しますが、モデル・コントローラーは未実装です。

---

### milestone_tasks

**説明**: マイルストーンとタスクの多対多の関連付けを管理する中間テーブル。

#### カラム

| カラム名 | 型 | NULL | 説明 |
|---------|---|------|------|
| milestone_id | integer | NO | マイルストーンID（外部キー） |
| task_id | integer | NO | タスクID（外部キー） |

**注意**: 主キー（id）なし

#### インデックス

```ruby
add_index 'milestone_tasks', ['milestone_id', 'task_id'], unique: true
```

#### 外部キー

```ruby
add_foreign_key 'milestone_tasks', 'milestones'
add_foreign_key 'milestone_tasks', 'tasks'
```

**注記**: スキーマ定義は存在しますが、モデル・コントローラーは未実装です。

---

## リレーションシップ

### 実装済み

```
Category (1) ──< has_many >── (N) Task
Category (1) ──< has_many >── (N) RoutineTask
RoutineTask (1) ──< has_many >── (N) Task
```

**削除時の動作**:
- カテゴリ削除 → タスク・習慣タスクの `category_id` が NULL
- 習慣タスク削除 → タスクの `routine_task_id` が NULL（生成済みタスクは残る）

### 未実装

```
Milestone (N) ──< has_many through >── (N) Task
```

---

## 習慣化タスク機能の設計

### 設計方針

- **MTI（Multi-Table Inheritance）**: テンプレート（routine_tasks）とインスタンス（tasks）を分離
- **生成履歴テーブルなし**: シンプルな構成
- **generated_at と created_at の分離**: 遅延検知とデバッグ性向上

### データフロー

```
1. ユーザーが習慣タスクを作成
   → routine_tasks テーブルに保存

2. 非同期ジョブが定期実行
   → next_generation_at が現在時刻を過ぎた習慣タスクを検索
   → tasks テーブルに新しいタスクを生成
   → last_generated_at を更新

3. タスク数が上限（max_active_tasks）を超える場合
   → generated_at が古いタスクから削除
```

### インデックス戦略

すべてのインデックスは **B-tree（デフォルト）** を使用：
- 等価検索（`=`）
- レンジ検索（`<`, `>`）
- ソート（`ORDER BY`）
に対応

---

## スキーマ変更手順

1. `db/schemas/` 内のファイルを編集
2. 新規テーブルの場合は `db/Schemafile` に require を追加
3. `make ridgepole-dry-run` で変更内容をプレビュー
4. `make ridgepole-apply` で変更を適用
5. **このドキュメントを更新**（最終更新日と変更内容を記載）

詳細: [DEVELOPMENT_GUIDE.md](../DEVELOPMENT_GUIDE.md#ridgepoleによるスキーマ管理)

---

## 更新履歴

| 日付 | バージョン | 変更内容 |
|------|-----------|---------|
| 2025-11-01 | 2.2.0 | routine_tasksテーブルのカラム情報を完全化。due_date_offset_days、due_date_offset_hour、start_generation_atカラムの説明を追加。モデルコードを最新の実装に合わせて更新。 |
| 2025-10-21 | 2.1.0 | routine_tasksテーブルのinterval_valueカラムをNULL許可に変更。frequencyがcustomの場合のみinterval_valueが必須、daily/weekly/monthlyの場合はNULLとする仕様に変更。 |
| 2025-10-20 | 2.0.0 | 習慣化タスク機能を追加。routine_tasksテーブル新規追加、tasksテーブルにroutine_task_id/generated_atカラム追加。MTI採用、生成履歴テーブルなし。ドキュメントを簡潔に整理。 |
| 2025-10-19 | 1.0.0 | 初版作成。既存4テーブル（tasks, categories, milestones, milestone_tasks）の定義を記載。 |

---

## 参考資料

- [Ridgepole公式ドキュメント](https://github.com/ridgepole/ridgepole)
- [スキーマファイル](../db/Schemafile)
- [テーブル定義ディレクトリ](../db/schemas/)
- [開発ガイド](../DEVELOPMENT_GUIDE.md)
- [習慣化タスク機能の設計議論](https://github.com/Ryu1240/Routinify/issues/68)
