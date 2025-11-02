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
        routine_task = create(:routine_task, :daily, last_generated_at: 3.days.ago, start_generation_at: 4.days.ago, next_generation_at: 1.day.ago)
        expect(routine_task.tasks_to_generate_count(current_time)).to eq(3)
      end

      it '1日経過していれば1を返すこと' do
        routine_task = create(:routine_task, :daily, last_generated_at: 1.day.ago, start_generation_at: 2.days.ago, next_generation_at: 1.hour.ago)
        expect(routine_task.tasks_to_generate_count(current_time)).to eq(1)
      end
    end

    context 'weekly頻度の場合' do
      it '14日経過していれば2を返すこと' do
        routine_task = create(:routine_task, :weekly, last_generated_at: 14.days.ago, start_generation_at: 15.days.ago, next_generation_at: 7.days.ago)
        expect(routine_task.tasks_to_generate_count(current_time)).to eq(2)
      end
    end

    context 'custom頻度の場合' do
      it 'interval_value日数に基づいて計算すること' do
        routine_task = create(:routine_task, :custom, interval_value: 3, last_generated_at: 9.days.ago, start_generation_at: 10.days.ago, next_generation_at: 6.days.ago)
        expect(routine_task.tasks_to_generate_count(current_time)).to eq(3)
      end
    end

    context 'max_active_tasksを超える場合' do
      it 'max_active_tasksで上限を設定すること' do
        routine_task = create(:routine_task, :daily, max_active_tasks: 5, last_generated_at: 10.days.ago, start_generation_at: 11.days.ago, next_generation_at: 9.days.ago)
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

  describe '#generated?' do
    it 'last_generated_atがnilの場合はfalseを返すこと' do
      routine_task = build(:routine_task, last_generated_at: nil)
      expect(routine_task.generated?).to be false
    end

    it 'last_generated_atが設定されている場合はtrueを返すこと' do
      routine_task = build(:routine_task, last_generated_at: 1.day.ago)
      expect(routine_task.generated?).to be true
    end
  end

  describe '#calculate_due_date' do
    let(:generation_date) { Time.zone.parse('2024-01-01 10:00:00') }

    context 'オフセットが設定されていない場合' do
      it '生成日時の開始時刻を返すこと' do
        routine_task = build(:routine_task, due_date_offset_days: nil, due_date_offset_hour: nil)
        result = routine_task.calculate_due_date(generation_date)
        expect(result).to eq(generation_date.to_date.beginning_of_day)
      end
    end

    context '時のみ設定されている場合' do
      it '生成日に指定した時を加算した日時を返すこと' do
        routine_task = build(:routine_task, due_date_offset_days: nil, due_date_offset_hour: 14)
        result = routine_task.calculate_due_date(generation_date)
        expected = generation_date.to_date.beginning_of_day + 14.hours
        expect(result).to eq(expected)
      end
    end

    context '日と時が設定されている場合' do
      it '生成日に指定した日と時を加算した日時を返すこと' do
        routine_task = build(:routine_task, due_date_offset_days: 2, due_date_offset_hour: 14)
        result = routine_task.calculate_due_date(generation_date)
        expected = generation_date.to_date.beginning_of_day + 2.days + 14.hours
        expect(result).to eq(expected)
      end
    end

    context 'generation_dateがnilの場合' do
      it 'nilを返すこと' do
        routine_task = build(:routine_task)
        result = routine_task.calculate_due_date(nil)
        expect(result).to be_nil
      end
    end
  end

  describe 'バリデーション: due_date_offset_days' do
    it '0以上の値は有効であること' do
      [ 0, 1, 7, 30 ].each do |days|
        routine_task = build(:routine_task, due_date_offset_days: days)
        expect(routine_task).to be_valid
      end
    end

    it '負の値は無効であること' do
      routine_task = build(:routine_task, due_date_offset_days: -1)
      expect(routine_task).not_to be_valid
    end

    it 'nilは有効であること' do
      routine_task = build(:routine_task, due_date_offset_days: nil)
      expect(routine_task).to be_valid
    end
  end

  describe 'バリデーション: due_date_offset_hour' do
    it '0以上23以下の値は有効であること' do
      (0..23).each do |hour|
        routine_task = build(:routine_task, due_date_offset_hour: hour)
        expect(routine_task).to be_valid
      end
    end

    it '24以上の値は無効であること' do
      routine_task = build(:routine_task, due_date_offset_hour: 24)
      expect(routine_task).not_to be_valid
    end

    it '負の値は無効であること' do
      routine_task = build(:routine_task, due_date_offset_hour: -1)
      expect(routine_task).not_to be_valid
    end

    it 'nilは有効であること' do
      routine_task = build(:routine_task, due_date_offset_hour: nil)
      expect(routine_task).to be_valid
    end
  end


  describe 'バリデーション: start_generation_at' do
    it 'start_generation_atが必須であること' do
      routine_task = build(:routine_task, start_generation_at: nil)
      expect(routine_task).not_to be_valid
      expect(routine_task.errors[:start_generation_at]).to include('は必須です')
    end

    it '一度でも生成が行われた場合、start_generation_atは変更不可であること' do
      # 生成済みのroutine_taskを作成（start_generation_atはlast_generated_atより過去に設定）
      routine_task = create(:routine_task, :with_last_generation, start_generation_at: 2.days.ago)
      original_start_generation_at = routine_task.start_generation_at
      # 保存後に変更しようとする
      routine_task.start_generation_at = 2.days.from_now
      expect(routine_task).not_to be_valid
      expect(routine_task.errors[:start_generation_at]).to include('は一度でも生成が行われると変更できません')
      # 実際に保存しようとしても変更されないことを確認（reloadして確認）
      routine_task.reload
      expect(routine_task.start_generation_at).to be_within(1.second).of(original_start_generation_at)
    end

    it '生成が行われていない場合、start_generation_atは変更可能であること' do
      routine_task = create(:routine_task, start_generation_at: 1.day.ago)
      routine_task.start_generation_at = 2.days.from_now
      expect(routine_task).to be_valid
    end
  end

  describe 'ソフトデリート関連' do
    let(:routine_task) { create(:routine_task) }
    let!(:task1) { create(:task, routine_task: routine_task, account_id: routine_task.account_id) }
    let!(:task2) { create(:task, routine_task: routine_task, account_id: routine_task.account_id) }
    let!(:task3) { create(:task, account_id: routine_task.account_id) }

    describe '#tasks_with_deleted' do
      it '削除されたタスクも含めて取得できること' do
        task1.update_column(:deleted_at, Time.current)
        expect(routine_task.tasks_with_deleted.count).to eq(2)
      end
    end

    describe 'before_destroyコールバック' do
      it '習慣化タスク削除時に紐づくタスク（論理削除済み含む）を物理削除すること' do
        task1.update_column(:deleted_at, Time.current)
        task1_id = task1.id
        task2_id = task2.id

        routine_task.destroy

        expect(Task.with_deleted.find_by(id: task1_id)).to be_nil
        expect(Task.with_deleted.find_by(id: task2_id)).to be_nil
      end

      it '習慣化タスクに紐づかないタスクは削除しないこと' do
        task3_id = task3.id

        routine_task.destroy

        expect(Task.active.find_by(id: task3_id)).to be_present
      end
    end
  end
end
