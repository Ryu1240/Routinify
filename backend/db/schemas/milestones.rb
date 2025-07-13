create_table "milestones", force: :cascade do |t|
  t.string   "name",      limit: 255
  t.date     "due_date"
  t.datetime "created_at"
  t.datetime "updated_at"
end
