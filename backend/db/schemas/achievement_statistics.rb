create_table 'achievement_statistics', force: :cascade do |t|
  t.integer  'routine_task_id',           null: false
  t.string   'period_type',               limit: 50, null: false
  t.date     'period_start_date',        null: false
  t.date     'period_end_date',          null: false
  t.integer  'total_count',              null: false
  t.integer  'completed_count',          null: false
  t.integer  'incomplete_count',         null: false
  t.integer  'overdue_count',            null: false
  t.decimal  'achievement_rate',         precision: 5, scale: 2, null: false
  t.integer  'consecutive_periods_count', null: false
  t.decimal  'average_completion_days',   precision: 10, scale: 2, null: false
  t.datetime 'calculated_at',            null: false
  t.datetime 'created_at',               null: false
  t.datetime 'updated_at',               null: false
end

add_index 'achievement_statistics',
          %w[routine_task_id period_type period_start_date],
          name: 'index_achievement_statistics_on_routine_period',
          unique: true
add_foreign_key 'achievement_statistics', 'routine_tasks', on_delete: :cascade
