class RoutineTaskGeneratorJob < ApplicationJob
  queue_as :default

  def perform(routine_task_id, job_id)
    update_job_status(job_id, 'running', false)

    routine_task = RoutineTask.find(routine_task_id)
    current_time = Time.current

    # Step 0: 開始期限のチェック
    if current_time < routine_task.start_generation_at
      # 開始期限に達していない場合は何も生成しない
      update_job_status(job_id, 'completed', true, generated_tasks_count: 0, completed_at: current_time)
      return
    end

    # Step 1: 生成すべきタスク数を計算（上限に関係なく）
    tasks_to_generate = routine_task.tasks_to_generate_count(current_time)

    # Step 2: タスクを生成（上限に関係なく全て生成）
    generated_tasks_count = 0
    if tasks_to_generate > 0
      base_time = routine_task.calculate_base_time_for_generation(current_time)
      base_date = base_time.in_time_zone('Tokyo').to_date

      tasks_to_generate.times do |i|
        generation_date = (base_date + (i * routine_task.interval_days).days).beginning_of_day.in_time_zone('Tokyo')
        due_date = routine_task.calculate_due_date(generation_date) || generation_date

        Task.create!(
          account_id: routine_task.account_id,
          routine_task_id: routine_task.id,
          title: routine_task.title,
          due_date: due_date,
          priority: routine_task.priority,
          category_id: routine_task.category_id,
          status: 'pending',
          generated_at: generation_date
        )
        generated_tasks_count += 1
      end

      # Step 3: タスクが生成された場合のみ、last_generated_atとnext_generation_atを更新
      routine_task.update!(
        last_generated_at: current_time,
        next_generation_at: routine_task.calculate_next_generation_at(current_time)
      )
    end

    # Step 4: max_active_tasksを超えている場合、古いタスクを削除
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
    routine_task.reload
    incomplete_tasks = routine_task.tasks.where.not(status: 'completed')
    excess_count = incomplete_tasks.count - routine_task.max_active_tasks
    return unless excess_count > 0

    current_date = Date.current
    overdue_tasks = incomplete_tasks.where('due_date < ?', current_date).order(created_at: :asc)

    tasks_to_delete = if overdue_tasks.count < excess_count
      remaining = incomplete_tasks.where('due_date >= ? OR due_date IS NULL', current_date)
                                  .order(created_at: :asc)
                                  .limit(excess_count - overdue_tasks.count)
      overdue_tasks.to_a + remaining.to_a
    else
      overdue_tasks.limit(excess_count).to_a
    end

    Task.unscoped.where(id: tasks_to_delete.map(&:id)).update_all(deleted_at: Time.current)
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
