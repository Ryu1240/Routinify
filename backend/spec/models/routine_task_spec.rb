require 'rails_helper'

RSpec.describe RoutineTask, type: :model do
  describe 'バリデーション' do
    it '有効なファクトリを持つこと' do
      routine_task = build(:routine_task)
      expect(routine_task).to be_valid
    end

    it 'account_idが必須であること' do
      routine_task = build(:routine_task, account_id: nil)
      expect(routine_task).not_to be_valid
      expect(routine_task.errors[:account_id]).to include('は必須です')
    end

    it 'titleが必須であること' do
      routine_task = build(:routine_task, title: nil)
      expect(routine_task).not_to be_valid
      expect(routine_task.errors[:title]).to include('は必須です')
    end

    it 'titleが255文字以内であること' do
      routine_task = build(:routine_task, title: 'a' * 256)
      expect(routine_task).not_to be_valid
      expect(routine_task.errors[:title]).to include('は255文字以内で入力してください')
    end

    it 'frequencyが必須であること' do
      routine_task = build(:routine_task, frequency: nil)
      expect(routine_task).not_to be_valid
      expect(routine_task.errors[:frequency]).to include('は必須です')
    end

    it 'frequencyが許可された値であること' do
      %w[daily weekly monthly].each do |frequency|
        routine_task = build(:routine_task, frequency: frequency, interval_value: nil)
        expect(routine_task).to be_valid
      end

      # customの場合はinterval_valueが必要
      routine_task = build(:routine_task, frequency: 'custom', interval_value: 3)
      expect(routine_task).to be_valid

      routine_task = build(:routine_task, frequency: 'invalid')
      expect(routine_task).not_to be_valid
    end

    it 'next_generation_atが必須であること' do
      routine_task = build(:routine_task, next_generation_at: nil)
      expect(routine_task).not_to be_valid
    end

    it 'max_active_tasksが必須であること' do
      routine_task = build(:routine_task, max_active_tasks: nil)
      expect(routine_task).not_to be_valid
    end

    it 'max_active_tasksが1以上の整数であること' do
      routine_task = build(:routine_task, max_active_tasks: 0)
      expect(routine_task).not_to be_valid

      routine_task = build(:routine_task, max_active_tasks: 1)
      expect(routine_task).to be_valid
    end
  end

  describe '#active_tasks_count' do
    let(:routine_task) { create(:routine_task) }

    it '未完了タスクの数を正しくカウントすること' do
      create(:task, routine_task: routine_task, account_id: routine_task.account_id, status: 'pending')
      create(:task, routine_task: routine_task, account_id: routine_task.account_id, status: 'in_progress')
      create(:task, routine_task: routine_task, account_id: routine_task.account_id, status: 'completed')

      expect(routine_task.active_tasks_count).to eq(2)
    end

    it 'タスクがない場合は0を返すこと' do
      expect(routine_task.active_tasks_count).to eq(0)
    end

    it '完了タスクのみの場合は0を返すこと' do
      create(:task, routine_task: routine_task, account_id: routine_task.account_id, status: 'completed')
      create(:task, routine_task: routine_task, account_id: routine_task.account_id, status: 'completed')

      expect(routine_task.active_tasks_count).to eq(0)
    end
  end

  describe '#interval_days' do
    it 'dailyの場合は1を返すこと' do
      routine_task = build(:routine_task, :daily)
      expect(routine_task.interval_days).to eq(1)
    end

    it 'weeklyの場合は7を返すこと' do
      routine_task = build(:routine_task, :weekly)
      expect(routine_task.interval_days).to eq(7)
    end

    it 'monthlyの場合は30を返すこと' do
      routine_task = build(:routine_task, :monthly)
      expect(routine_task.interval_days).to eq(30)
    end

    it 'customの場合はinterval_valueを返すこと' do
      routine_task = build(:routine_task, :custom, interval_value: 5)
      expect(routine_task.interval_days).to eq(5)
    end

    it 'interval_valueがnilの場合は1を返すこと' do
      routine_task = build(:routine_task, frequency: 'custom', interval_value: nil)
      expect(routine_task.interval_days).to eq(1)
    end
  end

  describe '#tasks_to_generate_count' do
    let(:current_time) { Time.current }

    context '次回生成日時がまだ到来していない場合' do
      it '0を返すこと' do
        routine_task = create(:routine_task, next_generation_at: 1.hour.from_now)
        expect(routine_task.tasks_to_generate_count(current_time)).to eq(0)
      end
    end

    context '前回生成日時が未設定の場合' do
      it '1を返すこと' do
        routine_task = create(:routine_task, last_generated_at: nil, next_generation_at: 1.hour.ago)
        expect(routine_task.tasks_to_generate_count(current_time)).to eq(1)
      end
    end

    context 'daily頻度の場合' do
      it '3日経過していれば3を返すこと' do
        routine_task = create(:routine_task, :daily, last_generated_at: 3.days.ago, next_generation_at: 1.day.ago)
        expect(routine_task.tasks_to_generate_count(current_time)).to eq(3)
      end

      it '1日経過していれば1を返すこと' do
        routine_task = create(:routine_task, :daily, last_generated_at: 1.day.ago, next_generation_at: 1.hour.ago)
        expect(routine_task.tasks_to_generate_count(current_time)).to eq(1)
      end
    end

    context 'weekly頻度の場合' do
      it '14日経過していれば2を返すこと' do
        routine_task = create(:routine_task, :weekly, last_generated_at: 14.days.ago, next_generation_at: 7.days.ago)
        expect(routine_task.tasks_to_generate_count(current_time)).to eq(2)
      end
    end

    context 'custom頻度の場合' do
      it 'interval_value日数に基づいて計算すること' do
        routine_task = create(:routine_task, :custom, interval_value: 3, last_generated_at: 9.days.ago, next_generation_at: 6.days.ago)
        expect(routine_task.tasks_to_generate_count(current_time)).to eq(3)
      end
    end

    context 'max_active_tasksを超える場合' do
      it 'max_active_tasksで上限を設定すること' do
        routine_task = create(:routine_task, :daily, max_active_tasks: 5, last_generated_at: 10.days.ago, next_generation_at: 9.days.ago)
        expect(routine_task.tasks_to_generate_count(current_time)).to eq(5)
      end
    end
  end

  describe '#calculate_next_generation_at' do
    let(:base_time) { Time.current }

    it 'daily頻度の場合、base_timeから1日後を返すこと' do
      routine_task = build(:routine_task, :daily)
      expected_time = base_time + 1.day
      expect(routine_task.calculate_next_generation_at(base_time)).to be_within(1.second).of(expected_time)
    end

    it 'weekly頻度の場合、base_timeから7日後を返すこと' do
      routine_task = build(:routine_task, :weekly)
      expected_time = base_time + 7.days
      expect(routine_task.calculate_next_generation_at(base_time)).to be_within(1.second).of(expected_time)
    end

    it 'monthly頻度の場合、base_timeから30日後を返すこと' do
      routine_task = build(:routine_task, :monthly)
      expected_time = base_time + 30.days
      expect(routine_task.calculate_next_generation_at(base_time)).to be_within(1.second).of(expected_time)
    end

    it 'custom頻度の場合、base_timeからinterval_value日後を返すこと' do
      routine_task = build(:routine_task, :custom, interval_value: 5)
      expected_time = base_time + 5.days
      expect(routine_task.calculate_next_generation_at(base_time)).to be_within(1.second).of(expected_time)
    end
  end
end
