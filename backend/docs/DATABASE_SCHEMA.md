# データベーススキーマ設計書

**最終更新日**: 2025-10-19
**バージョン**: 1.0.0

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
| milestones | マイルストーン情報を管理 | ⚠️ スキーマのみ（モデル未実装） |
| milestone_tasks | タスクとマイルストーンの関連付け | ⚠️ スキーマのみ（モデル未実装） |

## ER図（テキスト形式）

```
┌─────────────┐          ┌─────────────┐
│  categories │          │    tasks    │
├─────────────┤          ├─────────────┤
│ id (PK)     │◄────┐    │ id (PK)     │
│ account_id  │     │    │ account_id  │
│ name        │     │    │ title       │
│ created_at  │     │    │ due_date    │
│ updated_at  │     │    │ status      │
└─────────────┘     │    │ priority    │
                    └────│ category_id │
                         │ created_at  │
                         │ updated_at  │
                         └─────────────┘
                               │
                               │ (未実装)
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

タスク情報を管理するメインテーブル。

#### カラム定義

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|---|------|-----------|------|
| id | integer | NO | AUTO_INCREMENT | 主キー |
| account_id | string(255) | NO | - | Auth0のユーザーID |
| title | string(255) | NO | - | タスク名 |
| due_date | date | YES | NULL | 期限日 |
| status | string(50) | YES | NULL | ステータス（pending, in_progress, completed, on_hold） |
| priority | string(50) | YES | NULL | 優先度（low, medium, high） |
| category_id | integer | YES | NULL | カテゴリID（外部キー） |
| created_at | datetime | NO | - | 作成日時 |
| updated_at | datetime | NO | - | 更新日時 |

#### インデックス

- `index_tasks_on_category_id`: category_id

#### 外部キー制約

- `category_id` → `categories.id` (ON DELETE: NULLIFY)

#### バリデーション（モデル層）

- `title`: 必須、最大255文字
- `account_id`: 必須
- `status`: pending, in_progress, completed, on_hold のいずれか
- `priority`: low, medium, high のいずれか
- `due_date`: 未来の日付（テスト環境では過去も許可）

#### リレーション

```ruby
belongs_to :category, optional: true
```

---

### categories（カテゴリ）

**実装状況**: ✅ 実装済み

タスクを分類するためのカテゴリ情報を管理。

#### カラム定義

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|---|------|-----------|------|
| id | integer | NO | AUTO_INCREMENT | 主キー |
| account_id | string(255) | NO | - | Auth0のユーザーID |
| name | string(255) | NO | - | カテゴリ名 |
| created_at | datetime | NO | - | 作成日時 |
| updated_at | datetime | NO | - | 更新日時 |

#### インデックス

なし

#### バリデーション（モデル層）

- `name`: 必須、最大255文字
- `account_id`: 必須
- `name`: account_idごとに一意

#### リレーション

```ruby
has_many :tasks, dependent: :nullify
```

---

### milestones（マイルストーン）

**実装状況**: ⚠️ スキーマのみ（モデル未実装）

複数のタスクをグループ化するマイルストーン機能（将来の実装予定）。

#### カラム定義

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|---|------|-----------|------|
| id | integer | NO | AUTO_INCREMENT | 主キー |
| name | string(255) | NO | - | マイルストーン名 |
| due_date | date | YES | NULL | 期限日 |
| created_at | datetime | NO | - | 作成日時 |
| updated_at | datetime | NO | - | 更新日時 |

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
```

- カテゴリが削除されると、関連するタスクの `category_id` は NULL になります（`on_delete: :nullify`）

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

`tasks` と `categories` テーブルには `account_id` カラムがあり、Auth0のユーザーIDを格納します。

- 型: `string(255)`
- 用途: マルチテナント対応（各ユーザーのデータを分離）
- スコープ: `AccountScoped` concernで自動的にフィルタリング

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
| 2025-10-19 | 1.0.0 | 初版作成。既存の4テーブル（tasks, categories, milestones, milestone_tasks）の定義を記載 |

---

## 参考資料

- [Ridgepole公式ドキュメント](https://github.com/ridgepole/ridgepole)
- [スキーマファイル](../db/Schemafile)
- [テーブル定義ディレクトリ](../db/schemas/)
- [開発ガイド](../DEVELOPMENT_GUIDE.md)
