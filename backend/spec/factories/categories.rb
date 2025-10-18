FactoryBot.define do
  factory :category do
    sequence(:account_id) { |n| "user-#{n}" }
    sequence(:name) { |n| "カテゴリ #{n}" }

    trait :work do
      name { "仕事" }
    end

    trait :personal do
      name { "個人" }
    end

    trait :urgent do
      name { "緊急" }
    end
  end
end
