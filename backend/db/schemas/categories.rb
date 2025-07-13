create_table "categories", force: :cascade do |t|
  t.string   "account_id", limit: 255
  t.string   "name",      limit: 255
  t.datetime "created_at"
  t.datetime "updated_at"
end
