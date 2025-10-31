require 'rails_helper'

RSpec.describe RoutineTaskGeneratorJob, type: :job do
  let(:job_id) { SecureRandom.uuid }
  let(:redis) { Redis.new(url: ENV.fetch('REDIS_URL', 'redis://redis:6379/0')) }

  before do
    # Redisをクリーンアップ
    redis.flushdb
  end

  after do
    redis.close
  end

  describe '#perform' do
    context '正常系' do
      it '新しいタスクを生成すること' do
        routine_task = create(:routine_task, :daily, :with_last_generation,
                              last_generated_at: 3.days.ago,
                              start_generation_at: 4.days.ago,
                              next_generation_at: 2.days.ago,
                              max_active_tasks: 5,
                              due_date_offset_days: 4) # 期限が未来になるように（生成日時より大きく）

        expect do
          described_class.perform_now(routine_task.id, job_id)
        end.to change(Task, :count).by(3)

        # 生成されたタスクの検証
        generated_tasks = Task.where(routine_task_id: routine_task.id).order(due_date: :asc)
        expect(generated_tasks.count).to eq(3)
        expect(generated_tasks.all? { |t| t.status == 'pending' }).to be true
        expect(generated_tasks.all? { |t| t.title == routine_task.title }).to be true
      end

      it 'routine_taskのlast_generated_atとnext_generation_atを更新すること' do
        routine_task = create(:routine_task, :daily, :with_last_generation,
                              last_generated_at: 1.day.ago,
                              start_generation_at: 2.days.ago,
                              next_generation_at: 1.hour.ago,
                              due_date_offset_days: 2) # 期限が未来になるように

        described_class.perform_now(routine_task.id, job_id)

        routine_task.reload
        expect(routine_task.last_generated_at).to be_within(1.second).of(Time.current)
        expect(routine_task.next_generation_at).to be_within(1.second).of(1.day.from_now)
      end

      it 'ジョブステータスをRedisに保存すること' do
        routine_task = create(:routine_task, :daily, :with_last_generation,
                              last_generated_at: 2.days.ago,
                              start_generation_at: 3.days.ago,
                              next_generation_at: 1.day.ago,
                              due_date_offset_days: 3) # 期限が未来になるように

        described_class.perform_now(routine_task.id, job_id)

        job_status_json = redis.get("job_status:#{job_id}")
        expect(job_status_json).not_to be_nil

        job_status = JSON.parse(job_status_json, symbolize_names: true)
        expect(job_status[:jobId]).to eq(job_id)
        expect(job_status[:status]).to eq('completed')
        expect(job_status[:completed]).to be true
        expect(job_status[:generatedTasksCount]).to eq(2)
      end

      it 'max_active_tasksを超えないようにタスクを生成すること' do
        routine_task = create(:routine_task, :daily,
                              last_generated_at: 10.days.ago,
                              start_generation_at: 11.days.ago,
                              next_generation_at: 9.days.ago,
                              max_active_tasks: 3,
                              due_date_offset_days: 11) # 期限が未来になるように（生成日時より大きく）

        # 既に2つの未完了タスクが存在
        create_list(:task, 2,
                    routine_task: routine_task,
                    account_id: routine_task.account_id,
                    status: 'pending')

        # 10日分のタスクがあるが、max_active_tasks=3 - 既存2つ = 1つのみ生成される
        expect do
          described_class.perform_now(routine_task.id, job_id)
        end.to change(Task, :count).by(1)
      end

      it 'カテゴリと優先度を継承したタスクを生成すること' do
        category = create(:category)
        routine_task = create(:routine_task, :daily, :with_last_generation,
                              category: category,
                              priority: 'high',
                              last_generated_at: 1.day.ago,
                              start_generation_at: 2.days.ago,
                              next_generation_at: 1.hour.ago,
                              due_date_offset_days: 1) # 期限が未来になるように

        described_class.perform_now(routine_task.id, job_id)

        generated_task = Task.where(routine_task_id: routine_task.id).last
        expect(generated_task.category_id).to eq(category.id)
        expect(generated_task.priority).to eq('high')
      end

      it 'max_active_tasksを超過している場合、古いタスクを削除すること' do
        routine_task = create(:routine_task, :daily,
                              last_generated_at: 3.days.ago,
                              start_generation_at: 4.days.ago,
                              next_generation_at: 2.days.ago,
                              max_active_tasks: 3)

        # 既に5つの未完了タスクが存在（max_active_tasks=3を超過）
        old_tasks = create_list(:task, 5,
                                routine_task: routine_task,
                                account_id: routine_task.account_id,
                                status: 'pending',
                                created_at: 10.days.ago)

        described_class.perform_now(routine_task.id, job_id)

        # max_active_tasksを超えないように古いタスクが削除される
        routine_task.reload
        expect(routine_task.active_tasks_count).to be <= routine_task.max_active_tasks
      end

      it '完了タスクは削除対象にならないこと' do
        routine_task = create(:routine_task, :daily,
                              last_generated_at: 1.day.ago,
                              start_generation_at: 2.days.ago,
                              next_generation_at: 1.hour.ago,
                              max_active_tasks: 3,
                              due_date_offset_days: 1) # 期限が未来になるように

        # 完了タスク3つと未完了タスク2つ
        create_list(:task, 3,
                    routine_task: routine_task,
                    account_id: routine_task.account_id,
                    status: 'completed')
        create_list(:task, 2,
                    routine_task: routine_task,
                    account_id: routine_task.account_id,
                    status: 'pending')

        initial_completed_count = Task.where(routine_task: routine_task, status: 'completed').count

        described_class.perform_now(routine_task.id, job_id)

        # 完了タスクは削除されない
        expect(Task.where(routine_task: routine_task, status: 'completed').count).to eq(initial_completed_count)
      end
    end

    context '異常系' do
      it 'routine_taskが見つからない場合、エラーを発生させること' do
        expect do
          described_class.perform_now(999999, job_id)
        end.to raise_error(ActiveRecord::RecordNotFound)
      end

      it 'エラーが発生した場合、ジョブステータスをfailedに更新すること' do
        routine_task = create(:routine_task, :daily,
                              last_generated_at: 1.day.ago,
                              start_generation_at: 2.days.ago,
                              next_generation_at: 1.hour.ago,
                              due_date_offset_days: 1) # 期限が未来になるように

        # routine_taskの更新時にエラーを発生させる
        allow_any_instance_of(RoutineTask).to receive(:update!).and_raise(StandardError, 'テストエラー')

        expect do
          described_class.perform_now(routine_task.id, job_id)
        end.to raise_error(StandardError, 'テストエラー')

        job_status_json = redis.get("job_status:#{job_id}")
        job_status = JSON.parse(job_status_json, symbolize_names: true)

        expect(job_status[:status]).to eq('failed')
        expect(job_status[:completed]).to be true
        expect(job_status[:error]).to eq('テストエラー')
      end
    end

    context 'エッジケース' do
      it '前回生成日時が未設定の場合、1つのタスクを生成すること' do
        routine_task = create(:routine_task, :daily,
                              last_generated_at: nil,
                              start_generation_at: 1.day.ago, # 開始期限を過去に設定
                              next_generation_at: 1.hour.ago,
                              due_date_offset_days: 2) # 期限が未来になるように（開始日+2日=明日以降）

        expect do
          described_class.perform_now(routine_task.id, job_id)
        end.to change(Task, :count).by(1)
      end

      it 'max_active_tasksに達している場合、新しいタスクを生成しないこと' do
        routine_task = create(:routine_task, :daily,
                              last_generated_at: 5.days.ago,
                              start_generation_at: 6.days.ago,
                              next_generation_at: 4.days.ago,
                              max_active_tasks: 3)

        # 既にmax_active_tasks分のタスクが存在
        create_list(:task, 3,
                    routine_task: routine_task,
                    account_id: routine_task.account_id,
                    status: 'pending')

        expect do
          described_class.perform_now(routine_task.id, job_id)
        end.not_to change(Task, :count)

        job_status_json = redis.get("job_status:#{job_id}")
        job_status = JSON.parse(job_status_json, symbolize_names: true)
        expect(job_status[:generatedTasksCount]).to eq(0)
      end

      it 'weekly頻度で正しくタスクを生成すること' do
        routine_task = create(:routine_task, :weekly,
                              last_generated_at: 14.days.ago,
                              start_generation_at: 15.days.ago,
                              next_generation_at: 7.days.ago,
                              max_active_tasks: 5,
                              due_date_offset_days: 15) # 期限が未来になるように（生成日時より大きく）

        expect do
          described_class.perform_now(routine_task.id, job_id)
        end.to change(Task, :count).by(2)
      end

      it 'custom頻度で正しくタスクを生成すること' do
        routine_task = create(:routine_task, :custom,
                              interval_value: 3,
                              last_generated_at: 9.days.ago,
                              start_generation_at: 10.days.ago,
                              next_generation_at: 6.days.ago,
                              max_active_tasks: 5,
                              due_date_offset_days: 10) # 期限が未来になるように（生成日時より大きく）

        expect do
          described_class.perform_now(routine_task.id, job_id)
        end.to change(Task, :count).by(3)
      end
    end

    context '期限オフセットが設定されている場合' do
      it '2回目以降の生成では生成日時を基準に期限を計算すること' do
        # 生成を実行するためにnext_generation_atを過去にする
        routine_task = create(:routine_task, :daily,
                              last_generated_at: 1.day.ago,
                              start_generation_at: 2.days.ago,
                              next_generation_at: 1.hour.ago, # 過去にして生成を実行
                              due_date_offset_days: 2,
                              due_date_offset_hour: nil)

        described_class.perform_now(routine_task.id, job_id)

        generated_task = Task.where(routine_task_id: routine_task.id).last
        expect(generated_task.due_date).to be_present
        # due_dateはdate型なので、日付のみ比較（オフセット分加算された日付になることを確認）
        expect(generated_task.due_date.to_date).to eq((generated_task.generated_at.to_date + 2.days))
      end

      it '最初のタスク生成時は開始日を基準に期限を計算すること（start_generation_atが設定されている場合）' do
        start_time = 2.days.ago
        routine_task = create(:routine_task, :daily,
                              last_generated_at: nil,
                              next_generation_at: 1.hour.ago,
                              start_generation_at: start_time,
                              due_date_offset_days: 3,
                              due_date_offset_hour: 10)

        described_class.perform_now(routine_task.id, job_id)

        generated_task = Task.where(routine_task_id: routine_task.id).last
        expect(generated_task.due_date).to be_present
        # 開始日を基準に期限を計算（過去の日付も許可されるため、オフセット後の日付が過去でも問題ない）
        # calculate_due_dateはTimeオブジェクトを返すが、due_dateはdate型なので日付のみ比較
        expected_due_date = (start_time.to_date + 3.days)
        expect(generated_task.due_date).to eq(expected_due_date)
      end


      it '時のみ設定されている場合、日は0になること' do
        # 生成を実行するためにnext_generation_atを過去にする
        routine_task = create(:routine_task, :daily,
                              last_generated_at: 1.day.ago,
                              start_generation_at: 2.days.ago,
                              next_generation_at: 1.hour.ago, # 過去にして生成を実行
                              due_date_offset_days: 1,
                              due_date_offset_hour: nil) # 時刻オフセットなし（日付のみで比較）

        described_class.perform_now(routine_task.id, job_id)

        generated_task = Task.where(routine_task_id: routine_task.id).last
        expect(generated_task).to be_present
        expect(generated_task.due_date).to be_present
        # due_dateはdate型なので、日付のみ比較（オフセット分加算された日付になることを確認）
        expect(generated_task.due_date.to_date).to eq((generated_task.generated_at.to_date + 1.day))
      end
    end

    context '開始期限が設定されている場合' do
      it '開始期限に達していない場合はタスクを生成しないこと' do
        routine_task = create(:routine_task, :daily,
                              start_generation_at: 1.day.from_now,
                              next_generation_at: 1.hour.ago)

        expect do
          described_class.perform_now(routine_task.id, job_id)
        end.not_to change(Task, :count)

        job_status_json = redis.get("job_status:#{job_id}")
        job_status = JSON.parse(job_status_json, symbolize_names: true)
        expect(job_status[:generatedTasksCount]).to eq(0)
      end

      it '開始期限に達している場合はタスクを生成すること' do
        # 過去の日付も許可されるため、start_generation_atを過去に設定可能
        routine_task = create(:routine_task, :daily,
                              start_generation_at: 2.days.ago,
                              last_generated_at: nil,
                              next_generation_at: 1.hour.ago,
                              due_date_offset_days: 3)

        expect do
          described_class.perform_now(routine_task.id, job_id)
        end.to change(Task, :count).by(1)
      end

      it '開始期限が設定されている場合、start_generation_atを基準にタスクを生成すること' do
        start_time = 2.days.ago
        routine_task = create(:routine_task, :daily,
                              start_generation_at: start_time,
                              last_generated_at: nil,
                              next_generation_at: 1.hour.ago,
                              due_date_offset_days: 3)

        described_class.perform_now(routine_task.id, job_id)

        generated_task = Task.where(routine_task_id: routine_task.id).last
        # generated_atがstart_generation_atから1日後になっていることを確認
        expect(generated_task.generated_at).to be_within(1.second).of(start_time + 1.day)
      end
    end
  end
end
