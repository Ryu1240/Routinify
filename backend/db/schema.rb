# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 0) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "categories", force: :cascade do |t|
    t.string "account_id", limit: 255
    t.string "name", limit: 255
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "milestone_tasks", primary_key: ["milestone_id", "task_id"], force: :cascade do |t|
    t.integer "milestone_id", null: false
    t.integer "task_id", null: false
    t.index ["task_id"], name: "index_milestone_tasks_on_task_id"
  end

  create_table "milestones", force: :cascade do |t|
    t.string "name", limit: 255, null: false
    t.string "account_id", limit: 255, null: false
    t.text "description"
    t.date "start_date"
    t.string "status", limit: 255, default: "planning", null: false
    t.date "due_date"
    t.datetime "completed_at"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.index ["account_id"], name: "index_milestones_on_account_id"
    t.index ["status"], name: "index_milestones_on_status"
  end

  create_table "routine_tasks", force: :cascade do |t|
    t.string "account_id", limit: 255, null: false
    t.string "title", limit: 255, null: false
    t.string "frequency", limit: 50, null: false
    t.integer "interval_value"
    t.datetime "last_generated_at"
    t.datetime "next_generation_at", null: false
    t.integer "max_active_tasks", default: 3, null: false
    t.integer "category_id"
    t.string "priority", limit: 50
    t.boolean "is_active", default: true, null: false
    t.integer "due_date_offset_days"
    t.integer "due_date_offset_hour"
    t.datetime "start_generation_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["account_id", "is_active"], name: "index_routine_tasks_on_account_id_and_is_active"
    t.index ["category_id"], name: "index_routine_tasks_on_category_id"
    t.index ["next_generation_at"], name: "index_routine_tasks_on_next_generation_at"
  end

  create_table "tasks", force: :cascade do |t|
    t.string "account_id", limit: 255
    t.string "title", limit: 255
    t.date "due_date"
    t.string "status", limit: 50
    t.string "priority", limit: 50
    t.integer "category_id"
    t.integer "routine_task_id"
    t.datetime "generated_at"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.datetime "deleted_at"
    t.index ["category_id"], name: "index_tasks_on_category_id"
    t.index ["deleted_at"], name: "index_tasks_on_deleted_at"
    t.index ["routine_task_id", "deleted_at", "generated_at"], name: "index_tasks_on_routine_and_deleted_and_generated"
    t.index ["routine_task_id", "status", "generated_at"], name: "index_tasks_on_routine_and_status_and_generated"
  end

  add_foreign_key "milestone_tasks", "milestones"
  add_foreign_key "milestone_tasks", "tasks"
  add_foreign_key "routine_tasks", "categories", on_delete: :nullify
  add_foreign_key "tasks", "categories", on_delete: :nullify
  add_foreign_key "tasks", "routine_tasks", on_delete: :nullify
end
