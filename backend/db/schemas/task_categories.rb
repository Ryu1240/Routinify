create_table "task_categories", id: false, force: :cascade do |t|
  t.integer "task_id",     null: false
  t.integer "category_id", null: false
end
add_index "task_categories", ["task_id", "category_id"], unique: true, name: "index_task_categories_on_task_id_and_category_id"
add_foreign_key "task_categories", "tasks"
add_foreign_key "task_categories", "categories" 