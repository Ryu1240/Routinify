create_table "categories", force: :cascade do |t|
  t.string   "accountId", limit: 255
  t.string   "name",      limit: 255
  t.datetime "created_at"
  t.datetime "updated_at"
end 