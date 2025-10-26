class RoutineTaskGeneratorJob < ApplicationJob
  queue_as :default

  def perform(routine_task_id, job_id)
    update_job_status(job_id, 'running', false)

    routine_task = RoutineTask.find(routine_task_id)
    current_time = Time.current

    # Step 1: 現在の未完了タスク数を取得
    current_active_count = routine_task.active_tasks_count

    # Step 2: 生成すべきタスク数を計算
    tasks_to_generate = routine_task.tasks_to_generate_count(current_time)

    # Step 3: 利用可能なスロット数を計算
    available_slots = routine_task.max_active_tasks - current_active_count

    # Step 4: 実際に生成するタスク数を決定
    actual_generate_count = [tasks_to_generate, available_slots].min.clamp(0, Float::INFINITY)

    # Step 5: タスクを生成
    generated_tasks_count = 0
    if actual_generate_count > 0
      actual_generate_count.times do |i|
        # 未来の日付にするため、現在時刻から1日後を基準にする
        due_date = current_time + ((i + 1) * routine_task.interval_days).days

        Task.create!(
          account_id: routine_task.account_id,
          routine_task_id: routine_task.id,
          title: routine_task.title,
          due_date: due_date,
          priority: routine_task.priority,
          category_id: routine_task.category_id,
          status: 'pending'
        )
        generated_tasks_count += 1
      end
    end

    # Step 6: last_generated_atとnext_generation_atを更新
    routine_task.update!(
      last_generated_at: current_time,
      next_generation_at: routine_task.calculate_next_generation_at(current_time)
    )

    # Step 7: max_active_tasksを超えている場合、古いタスクを削除
    cleanup_excess_tasks(routine_task)

    # ジョブ完了ステータスを更新
    update_job_status(job_id, 'completed', true, generated_tasks_count: generated_tasks_count, completed_at: current_time)
  rescue StandardError => e
    # エラー時のステータス更新
    update_job_status(job_id, 'failed', true, error: e.message)
    raise e
  end

  private

  def cleanup_excess_tasks(routine_task)
    # 未完了タスクを取得
    incomplete_tasks = routine_task.tasks.where.not(status: 'completed').order(created_at: :asc)

    # max_active_tasksを超えている場合、古いタスクから削除
    excess_count = incomplete_tasks.count - routine_task.max_active_tasks
    if excess_count > 0
      tasks_to_delete = incomplete_tasks.limit(excess_count)
      tasks_to_delete.destroy_all
    end
  end

  def update_job_status(job_id, status, completed, additional_data = {})
    redis = Redis.new(url: ENV.fetch('REDIS_URL', 'redis://redis:6379/0'))

    job_data = {
      jobId: job_id,
      status: status,
      completed: completed,
      createdAt: additional_data[:created_at] || Time.current.iso8601
    }

    job_data[:generatedTasksCount] = additional_data[:generated_tasks_count] if additional_data[:generated_tasks_count]
    job_data[:error] = additional_data[:error] if additional_data[:error]
    job_data[:completedAt] = additional_data[:completed_at].iso8601 if additional_data[:completed_at]

    # Redisに保存（24時間保持）
    redis.setex("job_status:#{job_id}", 24.hours.to_i, job_data.to_json)
  ensure
    redis&.close
  end
end
