create_table 'milestone_tasks', id: false, force: :cascade do |t|
  t.integer 'milestone_id', null: false
  t.integer 'task_id',      null: false
end
# 複合主キーを設定（PostgreSQLでは複合主キーが自動的にユニークインデックスも作成するため、ユニークインデックスの定義は不要）
execute('ALTER TABLE milestone_tasks ADD PRIMARY KEY (milestone_id, task_id)')
add_foreign_key 'milestone_tasks', 'milestones'
add_foreign_key 'milestone_tasks', 'tasks'
