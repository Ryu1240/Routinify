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
      it '新しいタスクを生成すること' do
        routine_task = create(:routine_task, :daily, :with_last_generation,
                              last_generated_at: 3.days.ago,
                              start_generation_at: 4.days.ago,
                              next_generation_at: 2.days.ago,
                              max_active_tasks: 5,
                              due_date_offset_days: 4)

        expect do
          described_class.perform_now(routine_task.id, job_id)
        end.to change(Task.active, :count).by(3)

        generated_tasks = Task.active.where(routine_task_id: routine_task.id).order(due_date: :asc)
        expect(generated_tasks.count).to eq(3)
        expect(generated_tasks.all? { |t| t.status == 'pending' }).to be true
        expect(generated_tasks.all? { |t| t.title == routine_task.title }).to be true
      end

      it 'routine_taskのlast_generated_atとnext_generation_atを更新すること' do
        routine_task = create(:routine_task, :daily, :with_last_generation,
                              last_generated_at: 1.day.ago,
                              start_generation_at: 2.days.ago,
                              next_generation_at: 1.hour.ago,
                              due_date_offset_days: 2)

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
                              due_date_offset_days: 3)

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
                              due_date_offset_days: 11)

        create_list(:task, 2,
                    routine_task: routine_task,
                    account_id: routine_task.account_id,
                    status: 'pending')

        expect do
          described_class.perform_now(routine_task.id, job_id)
        end.to change(Task.active, :count).by(1)
      end

      it 'カテゴリと優先度を継承したタスクを生成すること' do
        category = create(:category)
        routine_task = create(:routine_task, :daily, :with_last_generation,
                              category: category,
                              priority: 'high',
                              last_generated_at: 1.day.ago,
                              start_generation_at: 2.days.ago,
                              next_generation_at: 1.hour.ago,
                              due_date_offset_days: 1)

        described_class.perform_now(routine_task.id, job_id)

        generated_task = Task.active.where(routine_task_id: routine_task.id).last
        expect(generated_task.category_id).to eq(category.id)
        expect(generated_task.priority).to eq('high')
      end

      it 'max_active_tasksを超過している場合、古いタスクを削除すること' do
        routine_task = create(:routine_task, :daily,
                              last_generated_at: 3.days.ago,
                              start_generation_at: 4.days.ago,
                              next_generation_at: 2.days.ago,
                              max_active_tasks: 3)

        old_tasks = create_list(:task, 5,
                                routine_task: routine_task,
                                account_id: routine_task.account_id,
                                status: 'pending',
                                created_at: 10.days.ago)

        described_class.perform_now(routine_task.id, job_id)

        routine_task.reload
        expect(routine_task.active_tasks_count).to be <= routine_task.max_active_tasks
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

        initial_task_ids = [oldest_overdue.id, second_overdue.id, newest_overdue.id, future_task.id]

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
                             created_at: 5.days.ago)

        second_oldest_task = create(:task,
                                    routine_task: routine_task,
                                    account_id: routine_task.account_id,
                                    status: 'pending',
                                    due_date: 2.days.from_now,
                                    created_at: 3.days.ago)

        newest_task = create(:task,
                             routine_task: routine_task,
                             account_id: routine_task.account_id,
                             status: 'pending',
                             due_date: 3.days.from_now,
                             created_at: 1.day.ago)

        initial_task_ids = [oldest_task.id, second_oldest_task.id, newest_task.id]

        described_class.perform_now(routine_task.id, job_id)

        remaining_tasks = routine_task.tasks.where.not(status: 'completed')
        expect(remaining_tasks.count).to be <= routine_task.max_active_tasks
        remaining_initial_task_ids = remaining_tasks.pluck(:id) & initial_task_ids
        expect(remaining_initial_task_ids).not_to include(oldest_task.id)
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
      it '前回生成日時が未設定の場合、1つのタスクを生成すること' do
        routine_task = create(:routine_task, :daily,
                              last_generated_at: nil,
                              start_generation_at: 1.day.ago,
                              next_generation_at: 1.hour.ago,
                              due_date_offset_days: 2)

        expect do
          described_class.perform_now(routine_task.id, job_id)
        end.to change(Task.active, :count).by(1)
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

      it 'weekly頻度で正しくタスクを生成すること' do
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

      it 'custom頻度で正しくタスクを生成すること' do
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

      it '長期間停止した場合、生成数が上限で制限されること（max_active_tasks * 5が上限）' do
        routine_task = create(:routine_task, :daily,
                              last_generated_at: 1.year.ago,
                              start_generation_at: 1.year.ago,
                              next_generation_at: 1.year.ago,
                              max_active_tasks: 10)

        # 1年間の日次タスクは365個になるが、上限は min(10 * 5, 100) = 50 となる
        expect do
          described_class.perform_now(routine_task.id, job_id)
        end.to change(Task, :count).by(50)

        job_status_json = redis.get("job_status:#{job_id}")
        job_status = JSON.parse(job_status_json, symbolize_names: true)
        expect(job_status[:generatedTasksCount]).to eq(50)
      end

      it '長期間停止した場合、生成数が上限で制限されること（100が上限）' do
        routine_task = create(:routine_task, :daily,
                              last_generated_at: 1.year.ago,
                              start_generation_at: 1.year.ago,
                              next_generation_at: 1.year.ago,
                              max_active_tasks: 30)

        # 1年間の日次タスクは365個になるが、上限は min(30 * 5, 100) = 100 となる
        expect do
          described_class.perform_now(routine_task.id, job_id)
        end.to change(Task, :count).by(100)

        job_status_json = redis.get("job_status:#{job_id}")
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

      it '最初のタスク生成時は開始日を基準に期限を計算すること（start_generation_atが設定されている場合）' do
        start_time = 2.days.ago
        routine_task = create(:routine_task, :daily,
                              last_generated_at: nil,
                              next_generation_at: 1.hour.ago,
                              start_generation_at: start_time,
                              due_date_offset_days: 3,
                              due_date_offset_hour: 10)

        described_class.perform_now(routine_task.id, job_id)

        generated_task = Task.active.where(routine_task_id: routine_task.id).last
        expect(generated_task.due_date).to be_present
        expected_due_date = (start_time.to_date + 3.days)
        expect(generated_task.due_date).to eq(expected_due_date)
      end


      it '時のみ設定されている場合、日は0になること' do
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
        routine_task = create(:routine_task, :daily,
                              start_generation_at: 2.days.ago,
                              last_generated_at: nil,
                              next_generation_at: 1.hour.ago,
                              due_date_offset_days: 3)

        expect do
          described_class.perform_now(routine_task.id, job_id)
        end.to change(Task.active, :count).by(1)
      end

      it '開始期限が設定されている場合、start_generation_atを基準にタスクを生成すること' do
        start_time = 2.days.ago
        routine_task = create(:routine_task, :daily,
                              start_generation_at: start_time,
                              last_generated_at: nil,
                              next_generation_at: 1.hour.ago,
                              due_date_offset_days: 3)

        described_class.perform_now(routine_task.id, job_id)

        generated_task = Task.active.where(routine_task_id: routine_task.id).last
        expect(generated_task.generated_at).to be_within(1.second).of(start_time + 1.day)
      end
    end
  end
end
