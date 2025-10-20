create_table 'tasks', force: :cascade do |t|
  t.string   'account_id',       limit: 255
  t.string   'title',            limit: 255
  t.date     'due_date'
  t.string   'status',           limit: 50
  t.string   'priority',         limit: 50
  t.integer  'category_id'
  t.integer  'routine_task_id'
  t.datetime 'generated_at'
  t.datetime 'created_at'
  t.datetime 'updated_at'
end
add_index 'tasks', ['category_id'], name: 'index_tasks_on_category_id'
add_index 'tasks', ['routine_task_id', 'status', 'generated_at'],
          name: 'index_tasks_on_routine_and_status_and_generated'
add_foreign_key 'tasks', 'categories', on_delete: :nullify
add_foreign_key 'tasks', 'routine_tasks', on_delete: :nullify
