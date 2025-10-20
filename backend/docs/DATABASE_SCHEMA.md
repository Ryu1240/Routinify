# データベーススキーマ設計書

**最終更新日**: 2025-10-20
**バージョン**: 2.0.0

## 概要

このドキュメントは、Routinifyバックエンドのデータベーススキーマ設計を記載しています。

### スキーマ管理

- **管理ツール**: Ridgepole
- **スキーマ定義**: `db/Schemafile`
- **テーブル定義**: `db/schemas/` ディレクトリ
- **変更方法**: [DEVELOPMENT_GUIDE.md](../DEVELOPMENT_GUIDE.md#ridgepoleによるスキーマ管理) を参照

## テーブル一覧

| テーブル名 | 説明 | 実装状況 |
|-----------|------|---------|
| tasks | タスク情報を管理 | ✅ 実装済み |
| categories | タスクのカテゴリを管理 | ✅ 実装済み |
| recurring_tasks | 習慣化タスクのテンプレートを管理 | ✅ 実装済み |
| milestones | マイルストーン情報を管理 | ⚠️ スキーマのみ（モデル未実装） |
| milestone_tasks | タスクとマイルストーンの関連付け | ⚠️ スキーマのみ（モデル未実装） |

## ER図（テキスト形式）

```
┌─────────────────┐          ┌─────────────┐          ┌─────────────┐
│recurring_tasks  │          │  categories │          │    tasks    │
├─────────────────┤          ├─────────────┤          ├─────────────┤
│ id (PK)         │          │ id (PK)     │◄────┐    │ id (PK)     │
│ account_id      │          │ account_id  │     │    │ account_id  │
│ title           │          │ name        │     │    │ title       │
│ frequency       │          │ created_at  │     │    │ due_date    │
│ interval_value  │          │ updated_at  │     │    │ status      │
│ last_generated  │          └─────────────┘     │    │ priority    │
│ next_generation │                 ▲            └────│ category_id │
│ max_active_tasks│                 │                 │recurring_id │◄─┐
│ category_id (FK)│─────────────────┘                 │ generated_at│  │
│ priority        │                                   │ created_at  │  │
│ is_active       │                                   │ updated_at  │  │
│ created_at      │                                   └─────────────┘  │
│ updated_at      │                                          │         │
└─────────────────┘                                          │         │
         │                                                   │         │
         └───────────────────────────────────────────────────┘         │
                             1:N (習慣タスクが複数のタスクを生成)         │
                                                                       │
                                         (未実装) ────────────────────┘
                                                │
                                                ▼
                                    ┌──────────────────┐
                                    │  milestone_tasks │
                                    ├──────────────────┤
                                    │ milestone_id (FK)│
                                    │ task_id (FK)     │
                                    └──────────────────┘
                                                │
                                                │
                                                ▼
                                    ┌─────────────┐
                                    │  milestones │
                                    ├─────────────┤
                                    │ id (PK)     │
                                    │ name        │
                                    │ due_date    │
                                    │ created_at  │
                                    │ updated_at  │
                                    └─────────────┘
```

## テーブル詳細

### tasks（タスク）

**実装状況**: ✅ 実装済み

タスク情報を管理するメインテーブル。通常タスクと習慣タスクから生成されたタスクの両方を格納。

#### カラム定義

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|---|------|-----------|------|
| id | integer | NO | AUTO_INCREMENT | 主キー |
| account_id | string(255) | YES | - | Auth0のユーザーID |
| title | string(255) | YES | - | タスク名 |
| due_date | date | YES | NULL | 期限日 |
| status | string(50) | YES | NULL | ステータス（pending, in_progress, completed, on_hold） |
| priority | string(50) | YES | NULL | 優先度（low, medium, high） |
| category_id | integer | YES | NULL | カテゴリID（外部キー） |
| recurring_task_id | integer | YES | NULL | 習慣タスクID（外部キー、NULL=通常タスク） |
| generated_at | datetime | YES | NULL | 習慣タスクから生成された日時 |
| created_at | datetime | YES | - | レコード作成日時 |
| updated_at | datetime | YES | - | 更新日時 |

#### generated_at と created_at の違い

- **generated_at**: 習慣タスクから「論理的に生成すべき日時」
- **created_at**: データベースに「物理的に登録された日時」

**目的**:
- 非同期ジョブの遅延を検知できる
- 「古いタスクから削除」のロジックが正確に動作する

**例**:
```ruby
# 毎朝9:00に生成予定だが、サーバー負荷で15分遅延した場合
task.generated_at = 2025-10-20 09:00:00  # 本来の生成予定時刻
task.created_at   = 2025-10-20 09:15:30  # 実際のDB登録時刻
# => 遅延を検知可能
```

#### インデックス

- `index_tasks_on_category_id`: category_id
- `index_tasks_on_recurring_and_status_and_generated`: (recurring_task_id, status, generated_at)
  - 習慣タスクから生成されたアクティブなタスクを高速に取得

#### 外部キー制約

- `category_id` → `categories.id` (ON DELETE: NULLIFY)
- `recurring_task_id` → `recurring_tasks.id` (ON DELETE: SET NULL)

#### バリデーション（モデル層）

- `title`: 必須、最大255文字
- `account_id`: 必須
- `status`: pending, in_progress, completed, on_hold のいずれか
- `priority`: low, medium, high のいずれか
- `due_date`: 未来の日付（テスト環境では過去も許可）

#### リレーション

```ruby
belongs_to :category, optional: true
belongs_to :recurring_task, optional: true
```

---

### categories（カテゴリ）

**実装状況**: ✅ 実装済み

タスクを分類するためのカテゴリ情報を管理。

#### カラム定義

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|---|------|-----------|------|
| id | integer | NO | AUTO_INCREMENT | 主キー |
| account_id | string(255) | YES | - | Auth0のユーザーID |
| name | string(255) | YES | - | カテゴリ名 |
| created_at | datetime | YES | - | 作成日時 |
| updated_at | datetime | YES | - | 更新日時 |

#### インデックス

なし

#### バリデーション（モデル層）

- `name`: 必須、最大255文字
- `account_id`: 必須
- `name`: account_idごとに一意

#### リレーション

```ruby
has_many :tasks, dependent: :nullify
has_many :recurring_tasks, dependent: :nullify
```

---

### recurring_tasks（習慣化タスク）

**実装状況**: ✅ 実装済み

定期的にタスクを生成するためのテンプレートを管理。

#### カラム定義

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|---|------|-----------|------|
| id | integer | NO | AUTO_INCREMENT | 主キー |
| account_id | string(255) | NO | - | Auth0のユーザーID |
| title | string(255) | NO | - | 習慣タスク名 |
| frequency | string(50) | NO | - | 頻度タイプ（daily, weekly, monthly, custom） |
| interval_value | integer | NO | 1 | 繰り返し間隔（frequency=customの場合、日数で指定） |
| last_generated_at | datetime | YES | NULL | 最後にタスクを生成した日時 |
| next_generation_at | datetime | NO | - | 次回タスク生成日時 |
| max_active_tasks | integer | NO | 3 | 同時に存在できる未完了タスクの上限 |
| category_id | integer | YES | NULL | カテゴリID（外部キー） |
| priority | string(50) | YES | NULL | 生成されるタスクの優先度（low, medium, high） |
| is_active | boolean | NO | true | 有効/無効フラグ |
| created_at | datetime | NO | - | 作成日時 |
| updated_at | datetime | NO | - | 更新日時 |

#### frequency の値

| 値 | 説明 | interval_value |
|----|------|---------------|
| daily | 毎日 | 無視される |
| weekly | 毎週 | 無視される |
| monthly | 毎月 | 無視される |
| custom | カスタム間隔 | 日数で指定（例: 3 = 3日ごと） |

#### インデックス

- `index_recurring_tasks_on_account_id_and_is_active`: (account_id, is_active)
  - ユーザーごとのアクティブな習慣タスクを取得
- `index_recurring_tasks_on_next_generation_at`: next_generation_at
  - 非同期ジョブで「生成すべき習慣タスク」を高速検索
- `index_recurring_tasks_on_category_id`: category_id

#### 外部キー制約

- `category_id` → `categories.id` (ON DELETE: NULLIFY)

#### バリデーション（モデル層・想定）

- `account_id`: 必須
- `title`: 必須、最大255文字
- `frequency`: 必須、daily/weekly/monthly/custom のいずれか
- `interval_value`: frequency=customの場合は1以上
- `next_generation_at`: 必須
- `max_active_tasks`: 1以上

#### リレーション

```ruby
has_many :tasks, dependent: :nullify
belongs_to :category, optional: true
```

---

### milestones（マイルストーン）

**実装状況**: ⚠️ スキーマのみ（モデル未実装）

複数のタスクをグループ化するマイルストーン機能（将来の実装予定）。

#### カラム定義

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|---|------|-----------|------|
| id | integer | NO | AUTO_INCREMENT | 主キー |
| name | string(255) | YES | - | マイルストーン名 |
| due_date | date | YES | NULL | 期限日 |
| created_at | datetime | YES | - | 作成日時 |
| updated_at | datetime | YES | - | 更新日時 |

#### 注記

- スキーマ定義は存在しますが、対応するモデルやコントローラーは未実装です
- 将来的な機能拡張のためのテーブル定義

---

### milestone_tasks（マイルストーン-タスク関連）

**実装状況**: ⚠️ スキーマのみ（モデル未実装）

マイルストーンとタスクの多対多の関連付けを管理する中間テーブル。

#### カラム定義

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|---|------|-----------|------|
| milestone_id | integer | NO | - | マイルストーンID（外部キー） |
| task_id | integer | NO | - | タスクID（外部キー） |

**注意**: このテーブルには主キー（id）がありません（`id: false`）

#### インデックス

- `index_milestone_tasks_on_milestone_id_and_task_id`: (milestone_id, task_id) UNIQUE

#### 外部キー制約

- `milestone_id` → `milestones.id`
- `task_id` → `tasks.id`

#### 注記

- スキーマ定義は存在しますが、対応するモデルやコントローラーは未実装です
- 将来的な機能拡張のためのテーブル定義

---

## リレーションシップサマリー

### 実装済みリレーション

```
Category (1) ──< has_many >── (N) Task
Task (N) ──< belongs_to >── (1) Category (optional: true)

RecurringTask (1) ──< has_many >── (N) Task
Task (N) ──< belongs_to >── (1) RecurringTask (optional: true)

Category (1) ──< has_many >── (N) RecurringTask
RecurringTask (N) ──< belongs_to >── (1) Category (optional: true)
```

#### カテゴリ削除時の動作
- カテゴリが削除されると、関連するタスクと習慣タスクの `category_id` は NULL になります（`on_delete: :nullify`）

#### 習慣タスク削除時の動作
- 習慣タスクが削除されると、関連するタスクの `recurring_task_id` は NULL になります（`on_delete: :set_null`）
- 生成済みのタスクは通常タスクとして残る

### 未実装リレーション（スキーマのみ）

```
Milestone (N) ──< has_many through >── (N) Task
Task (N) ──< has_many through >── (N) Milestone
```

- 中間テーブル: `milestone_tasks`

---

## 共通カラム

すべてのテーブル（milestone_tasksを除く）に以下の共通カラムがあります：

- `created_at`: レコード作成日時（自動設定）
- `updated_at`: レコード更新日時（自動更新）

---

## account_idについて

`tasks`, `categories`, `recurring_tasks` テーブルには `account_id` カラムがあり、Auth0のユーザーIDを格納します。

- 型: `string(255)`
- 用途: マルチテナント対応（各ユーザーのデータを分離）
- スコープ: `AccountScoped` concernで自動的にフィルタリング

---

## インデックス戦略

### B-treeインデックス（デフォルト）

すべてのインデックスはPostgreSQLのB-treeインデックス（デフォルト）を使用しています。

**理由**:
- 等価検索（`=`）に対応
- レンジ検索（`<`, `>`, `BETWEEN`）に対応
- ソート（`ORDER BY`）に対応
- 複合インデックスに効率的

### 習慣化タスク機能の重要なインデックス

#### recurring_tasks

```ruby
# アクティブな習慣タスクの取得
add_index 'recurring_tasks', ['account_id', 'is_active']

# 生成すべき習慣タスクの検索（非同期ジョブ用）
add_index 'recurring_tasks', ['next_generation_at']
```

**クエリ例**:
```sql
SELECT * FROM recurring_tasks
WHERE next_generation_at <= NOW()
  AND is_active = true;
```

#### tasks

```ruby
# 習慣タスクから生成されたアクティブなタスクの取得と削除
add_index 'tasks', ['recurring_task_id', 'status', 'generated_at']
```

**クエリ例**:
```sql
-- アクティブなタスクを古い順に取得（削除対象の特定）
SELECT * FROM tasks
WHERE recurring_task_id = 123
  AND status != 'completed'
ORDER BY generated_at ASC;
```

---

## 習慣化タスク機能の設計方針

### MTI（Multi-Table Inheritance）

- `recurring_tasks`: テンプレート（習慣タスクの定義）
- `tasks`: インスタンス（生成されたタスク）
- プロパティ（title, priority, category_id）の重複は「スナップショット」として意図的

**利点**:
- 習慣タスクを更新しても、過去に生成されたタスクは変わらない
- テーブルが分離され、パフォーマンスが良い

### 生成履歴テーブルなし

- `recurring_tasks.last_generated_at`: 最終生成日時を記録
- `tasks.generated_at`: 各タスクの生成日時を記録
- 履歴テーブルを追加せず、シンプルな構成

**理由**:
- 必須要件（最終生成日、数制限）は履歴テーブルなしで実現可能
- 将来的に分析が必要になれば追加可能

### generated_at と created_at の分離

- `generated_at`: 習慣タスクから「論理的に生成すべき日時」
- `created_at`: データベースに「物理的に登録された日時」

**理由**:
- 非同期ジョブの遅延を検知できる
- 「古いタスクから削除」のロジックが正確に動作する
- デバッグ・トラブルシューティングが容易

---

## スキーマ変更の手順

スキーマを変更する場合は、以下の手順に従ってください：

1. `db/schemas/` ディレクトリ内の該当ファイルを編集
2. 新規テーブルの場合は `db/Schemafile` に require を追加
3. `make ridgepole-dry-run` で変更内容をプレビュー
4. `make ridgepole-apply` で変更を適用
5. **このドキュメントを更新**（最終更新日と変更内容を記載）

詳細は [DEVELOPMENT_GUIDE.md](../DEVELOPMENT_GUIDE.md#ridgepoleによるスキーマ管理) を参照してください。

---

## 更新履歴

| 日付 | バージョン | 変更内容 |
|------|-----------|---------|
| 2025-10-20 | 2.0.0 | 習慣化タスク機能を追加。recurring_tasksテーブルを新規追加、tasksテーブルにrecurring_task_id, generated_atカラムを追加。MTI（Multi-Table Inheritance）採用、生成履歴テーブルなし、generated_atとcreated_atを分離。 |
| 2025-10-19 | 1.0.0 | 初版作成。既存の4テーブル（tasks, categories, milestones, milestone_tasks）の定義を記載 |

---

## 参考資料

- [Ridgepole公式ドキュメント](https://github.com/ridgepole/ridgepole)
- [スキーマファイル](../db/Schemafile)
- [テーブル定義ディレクトリ](../db/schemas/)
- [開発ガイド](../DEVELOPMENT_GUIDE.md)
- [習慣化タスク機能の設計議論](https://github.com/Ryu1240/Routinify/issues/68)
