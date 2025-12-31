# 習慣化タスク生成の仕様

## 概要

`RoutineTaskGeneratorJob` は、習慣化タスク（`RoutineTask`）から定期的にタスク（`Task`）を生成するジョブです。

## 生成フロー

### Step 0: 開始期限のチェック
- `current_time < start_generation_at` の場合、何も生成せずに終了
- ジョブステータスを `completed` に更新（`generated_tasks_count: 0`）

### Step 1: 現在の未完了タスク数を取得
- `routine_task.active_tasks_count` で未完了タスク数を取得
- 完了タスク（`status: 'completed'`）はカウント対象外
- 論理削除済みタスク（`deleted_at` が設定されている）はカウント対象外

### Step 2: 生成すべきタスク数を計算
- `routine_task.tasks_to_generate_count(current_time)` で計算
- `next_generation_at > current_time` の場合、0を返す
- `last_generated_at` が未設定の場合、1を返す
- それ以外の場合：`((current_time - last_generated_at) / interval_days).floor.clamp(0, max_active_tasks)`

### Step 3: 利用可能なスロット数を計算
- `available_slots = max_active_tasks - current_active_count`
- 負の値になる可能性がある（上限超過時）

### Step 4: 実際に生成するタスク数を決定
- `actual_generate_count = min(tasks_to_generate, available_slots).clamp(0, Float::INFINITY)`
- 負の値は0にクランプされる

### Step 5: タスクを生成
- `actual_generate_count > 0` の場合のみ実行

#### 基準日時の決定
- 最初の生成時（`last_generated_at` が `nil`）：`start_generation_at` を使用
- 2回目以降：`last_generated_at` を使用

#### 生成日時の計算
- `generation_date = base_time + ((i + 1) * interval_days).days`
- `i` は0から始まるループカウンタ

#### 期限日時の計算
- 最初のタスク生成時（`is_first_generation && i == 0`）：
  - `due_date = calculate_due_date(start_generation_at) || generation_date`
- 2回目以降：
  - `due_date = calculate_due_date(generation_date) || generation_date`

#### タスクの作成
- `account_id`: `routine_task.account_id` を継承
- `routine_task_id`: `routine_task.id` を設定
- `title`: `routine_task.title` を継承
- `due_date`: 上記で計算した期限日時
- `priority`: `routine_task.priority` を継承
- `category_id`: `routine_task.category_id` を継承
- `status`: 常に `'pending'`（未着手）
- `generated_at`: 上記で計算した生成日時

### Step 6: last_generated_atとnext_generation_atを更新
- `last_generated_at`: `current_time` に更新
- `next_generation_at`: `calculate_next_generation_at(current_time)` で計算
  - `current_time + interval_days.days`

### Step 7: max_active_tasksを超えている場合、古いタスクを削除
- `cleanup_excess_tasks(routine_task)` を実行

#### cleanup_excess_tasks の仕様（現状）
1. 未完了タスクを取得（論理削除済みを除く）
   - `routine_task.tasks.where.not(status: 'completed')`
2. `created_at` でソート（古い順）
   - `order(created_at: :asc)`
3. 超過数を計算
   - `excess_count = incomplete_tasks.count - max_active_tasks`
4. 超過している場合、古いタスクから論理削除
   - `tasks_to_delete_ids = incomplete_tasks.limit(excess_count).pluck(:id)`
   - `Task.unscoped.where(id: tasks_to_delete_ids).update_all(deleted_at: Time.current)`

**問題点（現状の仕様）:**
- 期限超過タスク（`overdue`）が優先的に削除されない
- `created_at` のみでソートしているため、期限超過の新しいタスクが残り、期限前の古いタスクが削除される可能性がある

### Step 8: ジョブステータスを更新
- Redisにジョブステータスを保存
- `status`: `'completed'` または `'failed'`
- `generatedTasksCount`: 生成されたタスク数
- `completedAt`: 完了日時
- エラー時は `error` メッセージも保存

## 頻度（frequency）の仕様

### daily
- `interval_days = 1`

### weekly
- `interval_days = 7`

### monthly
- `interval_days = 30`

### custom
- `interval_days = interval_value || 1`
- `interval_value` が必須（バリデーション）

## 期限オフセットの仕様

### due_date_offset_days
- 期限日の日数オフセット（0以上）
- `nil` の場合はオフセットなし

### due_date_offset_hour
- 期限日の時オフセット（0-23）
- `nil` の場合はオフセットなし

### calculate_due_date の計算ロジック
1. `base_date` を日付に変換（`beginning_of_day`）
2. `due_date_offset_days` が設定されている場合、その日数を加算
3. `due_date_offset_hour` が設定されている場合、その時間を加算
4. 結果を返す

## テストケースの整理

### 1. 正常系
- [x] 新しいタスクを生成すること
- [x] `last_generated_at` と `next_generation_at` を更新すること
- [x] ジョブステータスをRedisに保存すること
- [x] `max_active_tasks` を超えないようにタスクを生成すること
- [x] カテゴリと優先度を継承したタスクを生成すること
- [x] `max_active_tasks` を超過している場合、古いタスクを削除すること
- [x] 完了タスクは削除対象にならないこと

### 2. 異常系
- [x] `routine_task` が見つからない場合、エラーを発生させること
- [x] エラーが発生した場合、ジョブステータスを `failed` に更新すること

### 3. エッジケース
- [x] 前回生成日時が未設定の場合、1つのタスクを生成すること
- [x] `max_active_tasks` に達している場合、新しいタスクを生成しないこと
- [x] `weekly` 頻度で正しくタスクを生成すること
- [x] `custom` 頻度で正しくタスクを生成すること

### 4. 期限オフセット
- [x] 2回目以降の生成では生成日時を基準に期限を計算すること
- [x] 最初のタスク生成時は開始日を基準に期限を計算すること
- [x] 時のみ設定されている場合、日は0になること

### 5. 開始期限
- [x] 開始期限に達していない場合はタスクを生成しないこと
- [x] 開始期限に達している場合はタスクを生成すること
- [x] 開始期限が設定されている場合、`start_generation_at` を基準にタスクを生成すること

### 6. 期限超過タスクの削除
**注意**: 現状の仕様では、期限超過タスクが優先的に削除されません。以下のテストケースは現状の仕様を確認するためのもので、期待される動作をテストしています。

- [x] 期限超過タスクが優先的に削除されること（現状の仕様では失敗する可能性がある）
- [x] 期限超過タスクが複数ある場合、期限が古い順に削除されること（現状の仕様では失敗する可能性がある）
- [x] 期限超過タスクがない場合、`created_at` が古い順に削除されること
- [x] 期限が設定されていないタスクは、期限超過タスクより後に削除されること（現状の仕様では失敗する可能性がある）

**現状の仕様の問題点:**
- `cleanup_excess_tasks` は `created_at` でソートしているため、期限超過タスクが優先的に削除されない
- 期限超過の新しいタスクが残り、期限前の古いタスクが削除される可能性がある

## 改善提案

### cleanup_excess_tasks の改善
現状の仕様では、期限超過タスクが優先的に削除されない問題があります。

**推奨される削除順序:**
1. 期限超過タスク（`due_date < current_time`）を優先
   - 期限が古い順（`due_date ASC`）
2. 期限前タスク（`due_date >= current_time` または `due_date IS NULL`）
   - `created_at` が古い順（`created_at ASC`）

**実装案:**
```ruby
def cleanup_excess_tasks(routine_task)
  incomplete_tasks = routine_task.tasks.where.not(status: 'completed')
  excess_count = incomplete_tasks.count - routine_task.max_active_tasks
  
  if excess_count > 0
    current_time = Time.current
    
    # 期限超過タスクを優先的に取得
    overdue_tasks = incomplete_tasks.where('due_date < ?', current_time)
                                    .order(due_date: :asc)
    
    # 期限超過タスクが不足する場合、期限前タスクも取得
    if overdue_tasks.count < excess_count
      remaining_count = excess_count - overdue_tasks.count
      future_tasks = incomplete_tasks.where('due_date >= ? OR due_date IS NULL', current_time)
                                     .order(created_at: :asc)
                                     .limit(remaining_count)
      tasks_to_delete = overdue_tasks + future_tasks.to_a
    else
      tasks_to_delete = overdue_tasks.limit(excess_count).to_a
    end
    
    tasks_to_delete_ids = tasks_to_delete.map(&:id)
    Task.unscoped.where(id: tasks_to_delete_ids).update_all(deleted_at: Time.current)
  end
end
```

