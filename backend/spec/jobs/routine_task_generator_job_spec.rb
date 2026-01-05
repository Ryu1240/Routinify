require 'rails_helper'

# 習慣化タスク生成ジョブのテスト
#
# テストケースの分類:
# 1. 正常系: 基本的な生成機能のテスト
# 2. 異常系: エラーハンドリングのテスト
# 3. エッジケース: 境界値や特殊なケースのテスト
# 4. 期限オフセット: 期限計算のテスト
# 5. 開始期限: 開始期限チェックのテスト
# 6. 期限超過タスクの削除: 上限超過時の削除ロジックのテスト（現状の仕様では期限超過タスクが優先的に削除されない）
#
# 仕様詳細: backend/docs/ROUTINE_TASK_GENERATION_SPEC.md
RSpec.describe RoutineTaskGeneratorJob, type: :job do
  let(:job_id) { SecureRandom.uuid }
  let(:redis) { Redis.new(url: ENV.fetch('REDIS_URL', 'redis://redis:6379/0')) }

  before do
    redis.flushdb
  end

  after do
    redis.close
  end

  describe '#perform' do
    context '正常系' do
      it '基本的なタスク生成機能が正しく動作すること' do
        category = create(:category)
        routine_task = create(:routine_task, :daily, :with_last_generation,
                              category: category,
                              priority: 'high',
                              last_generated_at: 1.day.ago,
                              start_generation_at: 2.days.ago,
                              next_generation_at: 1.hour.ago,
                              max_active_tasks: 5,
                              due_date_offset_days: 2)

        expect do
          described_class.perform_now(routine_task.id, job_id)
        end.to change(Task.active, :count).by(1)

        # タスクの属性を検証
        generated_tasks = Task.active.where(routine_task_id: routine_task.id).order(due_date: :asc)
        expect(generated_tasks.count).to eq(1)
        expect(generated_tasks.all? { |t| t.status == 'pending' }).to be true
        expect(generated_tasks.all? { |t| t.title == routine_task.title }).to be true

        generated_task = generated_tasks.last
        expect(generated_task.category_id).to eq(category.id)
        expect(generated_task.priority).to eq('high')

        # routine_taskの更新を検証
        routine_task.reload
        expect(routine_task.last_generated_at).to be_within(1.second).of(Time.current)
        expect(routine_task.next_generation_at).to be_within(1.second).of(1.day.from_now)

        # ジョブステータスを検証
        job_status_json = redis.get("job_status:#{job_id}")
        expect(job_status_json).not_to be_nil
        job_status = JSON.parse(job_status_json, symbolize_names: true)
        expect(job_status[:jobId]).to eq(job_id)
        expect(job_status[:status]).to eq('completed')
        expect(job_status[:completed]).to be true
        expect(job_status[:generatedTasksCount]).to eq(1)
      end

      it 'max_active_tasksを超えないようにタスクを生成すること' do
        routine_task = create(:routine_task, :daily,
                              last_generated_at: 10.days.ago,
                              start_generation_at: 11.days.ago,
                              next_generation_at: 9.days.ago,
                              max_active_tasks: 3,
                              due_date_offset_days: 11)

        create_list(:task, 2,
                    routine_task: routine_task,
                    account_id: routine_task.account_id,
                    status: 'pending')

        expect do
          described_class.perform_now(routine_task.id, job_id)
        end.to change(Task.active, :count).by(1)
      end
    end

    context '期限超過タスクの削除' do
      it '期限超過タスクが優先的に削除されること' do
        routine_task = create(:routine_task, :daily,
                              last_generated_at: 1.day.ago,
                              start_generation_at: 2.days.ago,
                              next_generation_at: 1.hour.ago,
                              max_active_tasks: 3)

        overdue_task = create(:task,
                              routine_task: routine_task,
                              account_id: routine_task.account_id,
                              status: 'pending',
                              due_date: 2.days.ago,
                              created_at: 1.day.ago)

        future_task = create(:task,
                             routine_task: routine_task,
                             account_id: routine_task.account_id,
                             status: 'pending',
                              due_date: 1.day.from_now,
                              created_at: 5.days.ago)

        future_task2 = create(:task,
                              routine_task: routine_task,
                              account_id: routine_task.account_id,
                              status: 'pending',
                              due_date: 2.days.from_now,
                              created_at: 4.days.ago)

        described_class.perform_now(routine_task.id, job_id)

        remaining_tasks = routine_task.tasks.where.not(status: 'completed')
        expect(remaining_tasks.count).to be <= routine_task.max_active_tasks
        expect(remaining_tasks.pluck(:id)).not_to include(overdue_task.id)
        expect(remaining_tasks.pluck(:id)).to include(future_task.id)
        expect(remaining_tasks.pluck(:id)).to include(future_task2.id)
      end

      it '期限超過タスクが複数ある場合、作成順に削除されること' do
        routine_task = create(:routine_task, :daily,
                              last_generated_at: 1.day.ago,
                              start_generation_at: 2.days.ago,
                              next_generation_at: 1.hour.ago,
                              max_active_tasks: 3)

        oldest_overdue = create(:task,
                                routine_task: routine_task,
                                account_id: routine_task.account_id,
                                status: 'pending',
                              due_date: 5.days.ago,
                              created_at: 5.days.ago)

        second_overdue = create(:task,
                                routine_task: routine_task,
                                account_id: routine_task.account_id,
                                status: 'pending',
                              due_date: 3.days.ago,
                              created_at: 3.days.ago)

        newest_overdue = create(:task,
                                 routine_task: routine_task,
                                 account_id: routine_task.account_id,
                                 status: 'pending',
                              due_date: 1.day.ago,
                              created_at: 1.day.ago)

        future_task = create(:task,
                             routine_task: routine_task,
                             account_id: routine_task.account_id,
                             status: 'pending',
                             due_date: 1.day.from_now,
                             created_at: 4.days.ago)

        initial_task_ids = [ oldest_overdue.id, second_overdue.id, newest_overdue.id, future_task.id ]

        described_class.perform_now(routine_task.id, job_id)

        remaining_tasks = routine_task.tasks.where.not(status: 'completed')
        expect(remaining_tasks.count).to be <= routine_task.max_active_tasks
        remaining_initial_task_ids = remaining_tasks.pluck(:id) & initial_task_ids
        expect(remaining_initial_task_ids).not_to include(oldest_overdue.id)
        expect(remaining_initial_task_ids).not_to include(second_overdue.id)
        expect(remaining_initial_task_ids).to include(newest_overdue.id)
        expect(remaining_initial_task_ids).to include(future_task.id)
      end

      it '期限超過タスクがない場合、created_atが古い順に削除されること' do
        today = Date.current
        routine_task = create(:routine_task, :daily,
                              last_generated_at: 2.days.ago,
                              start_generation_at: 3.days.ago,
                              next_generation_at: 1.hour.ago,
                              max_active_tasks: 3)

        oldest_task = create(:task,
                             routine_task: routine_task,
                             account_id: routine_task.account_id,
                             status: 'pending',
                             due_date: 1.day.from_now,
                             created_at: 5.days.ago,
                             generated_at: (today - 5.days).beginning_of_day.in_time_zone('Tokyo'))

        second_oldest_task = create(:task,
                                    routine_task: routine_task,
                                    account_id: routine_task.account_id,
                                    status: 'pending',
                                    due_date: 2.days.from_now,
                                    created_at: 3.days.ago,
                                    generated_at: (today - 3.days).beginning_of_day.in_time_zone('Tokyo'))

        newest_task = create(:task,
                             routine_task: routine_task,
                             account_id: routine_task.account_id,
                             status: 'pending',
                             due_date: 3.days.from_now,
                             created_at: 1.day.ago,
                             generated_at: (today - 1.day).beginning_of_day.in_time_zone('Tokyo'))

        initial_task_ids = [ oldest_task.id, second_oldest_task.id, newest_task.id ]

        # next_generation_atが1時間前（過去）なので、基準日は今日
        # 今日のタスクは既に存在しないため、今日のタスクを1個生成
        # 既存3つ + 新規生成1つ = 4つ、max_active_tasks=3なので1つ削除される
        # 削除ロジックはcreated_atでソートしているため、最も古いタスクから削除される
        described_class.perform_now(routine_task.id, job_id)

        remaining_tasks = routine_task.tasks.where.not(status: 'completed')
        expect(remaining_tasks.count).to eq(3)

        # 最も古いタスク（oldest_task）が削除されることを確認
        remaining_initial_task_ids = remaining_tasks.pluck(:id) & initial_task_ids
        expect(remaining_initial_task_ids).not_to include(oldest_task.id)
        expect(remaining_initial_task_ids).to include(second_oldest_task.id)
        expect(remaining_initial_task_ids).to include(newest_task.id)
      end

      it '期限が設定されていないタスクは、期限超過タスクより後に削除されること' do
        routine_task = create(:routine_task, :daily,
                              last_generated_at: 1.day.ago,
                              start_generation_at: 2.days.ago,
                              next_generation_at: 1.hour.ago,
                              max_active_tasks: 3)

        overdue_task = create(:task,
                               routine_task: routine_task,
                               account_id: routine_task.account_id,
                               status: 'pending',
                              due_date: 2.days.ago,
                              created_at: 1.day.ago)

        no_due_date_task = create(:task,
                                   routine_task: routine_task,
                                   account_id: routine_task.account_id,
                                   status: 'pending',
                              due_date: nil,
                              created_at: 5.days.ago)

        future_task = create(:task,
                             routine_task: routine_task,
                             account_id: routine_task.account_id,
                             status: 'pending',
                              due_date: 1.day.from_now,
                              created_at: 3.days.ago)

        described_class.perform_now(routine_task.id, job_id)

        remaining_tasks = routine_task.tasks.where.not(status: 'completed')
        expect(remaining_tasks.count).to be <= routine_task.max_active_tasks
        expect(remaining_tasks.pluck(:id)).not_to include(overdue_task.id)
        expect(remaining_tasks.pluck(:id)).to include(no_due_date_task.id)
        expect(remaining_tasks.pluck(:id)).to include(future_task.id)
      end

      it '完了タスクは削除対象にならないこと' do
        routine_task = create(:routine_task, :daily,
                              last_generated_at: 1.day.ago,
                              start_generation_at: 2.days.ago,
                              next_generation_at: 1.hour.ago,
                              max_active_tasks: 3,
                              due_date_offset_days: 1)

        create_list(:task, 3,
                    routine_task: routine_task,
                    account_id: routine_task.account_id,
                    status: 'completed')
        create_list(:task, 2,
                    routine_task: routine_task,
                    account_id: routine_task.account_id,
                    status: 'pending')

        initial_completed_count = Task.active.where(routine_task: routine_task, status: 'completed').count

        described_class.perform_now(routine_task.id, job_id)

        expect(Task.active.where(routine_task: routine_task, status: 'completed').count).to eq(initial_completed_count)
      end

      it 'max_active_tasksに達している場合でも、新しいタスクを生成し、上限に収まるように削除すること' do
        routine_task = create(:routine_task, :daily,
                              last_generated_at: 5.days.ago,
                              start_generation_at: 6.days.ago,
                              next_generation_at: 4.days.ago,
                              max_active_tasks: 3)

        existing_tasks = create_list(:task, 3,
                                    routine_task: routine_task,
                                    account_id: routine_task.account_id,
                                    status: 'pending',
                                    created_at: 10.days.ago)

        expect do
          described_class.perform_now(routine_task.id, job_id)
        end.to change(Task, :count).by(5)

        remaining_tasks = routine_task.tasks.where.not(status: 'completed')
        expect(remaining_tasks.count).to be <= routine_task.max_active_tasks

        job_status_json = redis.get("job_status:#{job_id}")
        job_status = JSON.parse(job_status_json, symbolize_names: true)
        expect(job_status[:generatedTasksCount]).to eq(5)
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
                              due_date_offset_days: 1)

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
      it '前回生成日時が未設定の場合、start_generation_atから現在時刻までのタスクを生成すること（開始日を含める）' do
        # 実行タイミングに依存しないように、日付を明確に設定
        start_date = Date.current - 3.days
        start_time = start_date.beginning_of_day.in_time_zone('Tokyo')
        routine_task = create(:routine_task, :daily,
                              last_generated_at: nil,
                              start_generation_at: start_time,
                              next_generation_at: 1.hour.ago,
                              due_date_offset_days: 2)

        # 3日前から開始している場合、開始日を含めて4個のタスクを生成（3日前、2日前、1日前、今日）
        # base_date = start_date (3日前)
        # current_date = Date.current (今日)
        # days_elapsed = 3
        # calculated_count = (3 / 1).floor + 1 = 4
        expect do
          described_class.perform_now(routine_task.id, job_id)
        end.to change(Task.active, :count).by(4)

        generated_tasks = Task.active.where(routine_task_id: routine_task.id).order(generated_at: :asc)
        expect(generated_tasks.count).to eq(4)
        expect(generated_tasks.first.generated_at.to_date).to eq(start_date)
        expect(generated_tasks.last.generated_at.to_date).to eq(Date.current)
      end

      it 'weekly頻度で2週間分のタスクを生成すること' do
        routine_task = create(:routine_task, :weekly,
                              last_generated_at: 14.days.ago,
                              start_generation_at: 15.days.ago,
                              next_generation_at: 7.days.ago,
                              max_active_tasks: 5,
                              due_date_offset_days: 15)

        expect do
          described_class.perform_now(routine_task.id, job_id)
        end.to change(Task.active, :count).by(2)
      end

      it 'custom頻度で3日間隔のタスクを生成すること' do
        routine_task = create(:routine_task, :custom,
                              interval_value: 3,
                              last_generated_at: 9.days.ago,
                              start_generation_at: 10.days.ago,
                              next_generation_at: 6.days.ago,
                              max_active_tasks: 5,
                              due_date_offset_days: 10)

        expect do
          described_class.perform_now(routine_task.id, job_id)
        end.to change(Task.active, :count).by(3)
      end

      it '長期間停止した場合、生成数が上限で制限されること' do
        # ケース1: max_active_tasks * 5が上限
        routine_task1 = create(:routine_task, :daily,
                               last_generated_at: 1.year.ago,
                               start_generation_at: 1.year.ago,
                               next_generation_at: 1.year.ago,
                               max_active_tasks: 10)

        job_id1 = SecureRandom.uuid
        expect do
          described_class.perform_now(routine_task1.id, job_id1)
        end.to change(Task, :count).by(50) # min(10 * 5, 100) = 50

        # ケース2: 100が上限
        routine_task2 = create(:routine_task, :daily,
                               last_generated_at: 1.year.ago,
                               start_generation_at: 1.year.ago,
                               next_generation_at: 1.year.ago,
                               max_active_tasks: 30)

        job_id2 = SecureRandom.uuid
        expect do
          described_class.perform_now(routine_task2.id, job_id2)
        end.to change(Task, :count).by(100) # min(30 * 5, 100) = 100

        job_status_json = redis.get("job_status:#{job_id2}")
        job_status = JSON.parse(job_status_json, symbolize_names: true)
        expect(job_status[:generatedTasksCount]).to eq(100)
      end

      it '通常のケースでは上限に達しないこと' do
        routine_task = create(:routine_task, :daily,
                              last_generated_at: 5.days.ago,
                              start_generation_at: 6.days.ago,
                              next_generation_at: 4.days.ago,
                              max_active_tasks: 10)

        # 5日分のタスクを生成（上限50より少ない）
        expect do
          described_class.perform_now(routine_task.id, job_id)
        end.to change(Task, :count).by(5)

        job_status_json = redis.get("job_status:#{job_id}")
        job_status = JSON.parse(job_status_json, symbolize_names: true)
        expect(job_status[:generatedTasksCount]).to eq(5)
      end
    end

    context '期限オフセットが設定されている場合' do
      it '2回目以降の生成では生成日時を基準に期限を計算すること' do
        routine_task = create(:routine_task, :daily,
                              last_generated_at: 1.day.ago,
                              start_generation_at: 2.days.ago,
                              next_generation_at: 1.hour.ago,
                              due_date_offset_days: 2,
                              due_date_offset_hour: nil)

        described_class.perform_now(routine_task.id, job_id)

        generated_task = Task.active.where(routine_task_id: routine_task.id).last
        expect(generated_task.due_date).to be_present
        expect(generated_task.due_date.to_date).to eq((generated_task.generated_at.to_date + 2.days))
      end

      it '最初のタスク生成時は生成日時を基準に期限を計算すること' do
        start_time = 2.days.ago
        routine_task = create(:routine_task, :daily,
                              last_generated_at: nil,
                              next_generation_at: 1.hour.ago,
                              start_generation_at: start_time,
                              due_date_offset_days: 3,
                              due_date_offset_hour: 10)

        described_class.perform_now(routine_task.id, job_id)

        # 最初のタスクは開始日を基準に期限が計算される
        generated_task = Task.active.where(routine_task_id: routine_task.id).order(generated_at: :asc).first
        expect(generated_task.due_date).to eq(generated_task.generated_at.to_date + 3.days)
      end

      it 'due_date_offset_hourがnilの場合、due_date_offset_daysのみで期限を計算すること' do
        routine_task = create(:routine_task, :daily,
                              last_generated_at: 1.day.ago,
                              start_generation_at: 2.days.ago,
                              next_generation_at: 1.hour.ago,
                              due_date_offset_days: 1,
                              due_date_offset_hour: nil)

        described_class.perform_now(routine_task.id, job_id)

        generated_task = Task.active.where(routine_task_id: routine_task.id).last
        expect(generated_task).to be_present
        expect(generated_task.due_date).to be_present
        expect(generated_task.due_date.to_date).to eq((generated_task.generated_at.to_date + 1.day))
      end
    end

    context '開始期限が設定されている場合' do
      it '開始期限に達していない場合はタスクを生成しないこと' do
        original_last_generated_at = 1.day.ago
        original_next_generation_at = 1.hour.ago
        routine_task = create(:routine_task, :daily,
                              start_generation_at: 1.day.from_now,
                              last_generated_at: original_last_generated_at,
                              next_generation_at: original_next_generation_at)

        expect do
          described_class.perform_now(routine_task.id, job_id)
        end.not_to change(Task, :count)

        # タスクが生成されなかった場合、last_generated_atとnext_generation_atは更新されない
        routine_task.reload
        expect(routine_task.last_generated_at).to be_within(1.second).of(original_last_generated_at)
        expect(routine_task.next_generation_at).to be_within(1.second).of(original_next_generation_at)

        job_status_json = redis.get("job_status:#{job_id}")
        job_status = JSON.parse(job_status_json, symbolize_names: true)
        expect(job_status[:generatedTasksCount]).to eq(0)
      end

      it '開始期限に達している場合はタスクを生成すること（開始日を含める）' do
        start_time = 2.days.ago
        routine_task = create(:routine_task, :daily,
                              start_generation_at: start_time,
                              last_generated_at: nil,
                              next_generation_at: 1.hour.ago,
                              due_date_offset_days: 3)

        # 開始日を含めて3個のタスクが生成される（2日前、1日前、今日）
        expect do
          described_class.perform_now(routine_task.id, job_id)
        end.to change(Task.active, :count).by(3)

        # 最初のタスクは開始日を基準に生成される
        generated_task = Task.active.where(routine_task_id: routine_task.id).order(generated_at: :asc).first
        expected_generated_at = start_time.in_time_zone('Tokyo').to_date.beginning_of_day.in_time_zone('Tokyo')
        expect(generated_task.generated_at).to be_within(1.second).of(expected_generated_at)
      end
    end
  end
end
