FactoryBot.define do
  factory :task do
    sequence(:account_id) { |n| "user-#{n}" }
    sequence(:title) { |n| "タスク #{n}" }
    due_date { Date.current + 1.week }
    status { "未着手" }
    priority { "medium" }
    category { "一般" }

    # 異なるステータスのタスク
    trait :completed do
      status { "完了" }
    end

    trait :in_progress do
      status { "進行中" }
    end

    trait :pending do
      status { "保留" }
    end

    # 異なる優先度のタスク
    trait :high_priority do
      priority { "high" }
    end

    trait :low_priority do
      priority { "low" }
    end

    # 異なるカテゴリのタスク
    trait :work do
      category { "仕事" }
    end

    trait :personal do
      category { "個人" }
    end

    trait :urgent do
      category { "緊急" }
    end

    # 期限関連
    trait :overdue do
      due_date { Date.current - 1.day }
    end

    trait :due_today do
      due_date { Date.current }
    end

    trait :due_tomorrow do
      due_date { Date.current + 1.day }
    end

    trait :no_due_date do
      due_date { nil }
    end

    # 長いタイトル
    trait :long_title do
      title { "a" * 255 }
    end

    # 特殊文字を含むタイトル
    trait :special_characters do
      title { "タスク (重要) - 緊急対応が必要です！" }
    end
  end
end 