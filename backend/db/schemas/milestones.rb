create_table 'milestones', force: :cascade do |t|
  t.string   'name', limit: 255, null: false
  t.string   'account_id', limit: 255, null: false
  t.text     'description'
  t.date     'start_date'
  t.string   'status', limit: 255, default: 'planning', null: false
  t.date     'due_date'
  t.datetime 'completed_at'
  t.datetime 'created_at'
  t.datetime 'updated_at'
end
add_index 'milestones', ['account_id'], name: 'index_milestones_on_account_id'
add_index 'milestones', ['status'], name: 'index_milestones_on_status'
