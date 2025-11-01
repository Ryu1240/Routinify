create_table 'milestone_tasks', primary_key: [:milestone_id, :task_id], force: :cascade do |t|
  t.integer 'milestone_id', null: false
  t.integer 'task_id',      null: false
end

add_index 'milestone_tasks', 'task_id'
add_foreign_key 'milestone_tasks', 'milestones'
add_foreign_key 'milestone_tasks', 'tasks'
