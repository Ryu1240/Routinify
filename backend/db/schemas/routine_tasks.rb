create_table 'routine_tasks', force: :cascade do |t|
  t.string   'account_id',         limit: 255, null: false
  t.string   'title',              limit: 255, null: false
  t.string   'frequency',          limit: 50,  null: false
  t.integer  'interval_value',     default: 1, null: false
  t.datetime 'last_generated_at'
  t.datetime 'next_generation_at',             null: false
  t.integer  'max_active_tasks',   default: 3, null: false
  t.integer  'category_id'
  t.string   'priority',           limit: 50
  t.boolean  'is_active',          default: true, null: false
  t.datetime 'created_at',                     null: false
  t.datetime 'updated_at',                     null: false
end

add_index 'routine_tasks', ['account_id', 'is_active'], name: 'index_routine_tasks_on_account_id_and_is_active'
add_index 'routine_tasks', ['next_generation_at'], name: 'index_routine_tasks_on_next_generation_at'
add_index 'routine_tasks', ['category_id'], name: 'index_routine_tasks_on_category_id'

add_foreign_key 'routine_tasks', 'categories', on_delete: :nullify
