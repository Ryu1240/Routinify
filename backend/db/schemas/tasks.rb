create_table "tasks", force: :cascade do |t|
  t.string   "account_id", limit: 255
  t.string   "title",     limit: 255
  t.date     "due_date"
  t.string   "status",    limit: 50
  t.string   "priority",  limit: 50
  t.string   "category",  limit: 50
  t.datetime "created_at"
  t.datetime "updated_at"
end 