create_table 'milestone_tasks', id: false, force: :cascade do |t|
  t.integer 'milestone_id', null: false
  t.integer 'task_id',      null: false
end
add_index 'milestone_tasks', ['milestone_id', 'task_id'], unique: true,
                                                          name: 'index_milestone_tasks_on_milestone_id_and_task_id'
add_foreign_key 'milestone_tasks', 'milestones'
add_foreign_key 'milestone_tasks', 'tasks'
