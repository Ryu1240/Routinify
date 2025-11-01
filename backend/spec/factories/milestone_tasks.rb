FactoryBot.define do
  factory :milestone_task do
    association :milestone
    association :task, factory: :task

    # 同じアカウントのタスクを確実に作成する
    after(:build) do |milestone_task|
      milestone_task.task.account_id = milestone_task.milestone.account_id
    end
  end
end
