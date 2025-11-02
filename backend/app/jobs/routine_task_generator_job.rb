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

    # Step 1: 現在の未完了タスク数を取得
    current_active_count = routine_task.active_tasks_count

    # Step 2: 生成すべきタスク数を計算
    tasks_to_generate = routine_task.tasks_to_generate_count(current_time)

    # Step 3: 利用可能なスロット数を計算
    available_slots = routine_task.max_active_tasks - current_active_count

    # Step 4: 実際に生成するタスク数を決定
    actual_generate_count = [ tasks_to_generate, available_slots ].min.clamp(0, Float::INFINITY)

    # Step 5: タスクを生成
    generated_tasks_count = 0
    if actual_generate_count > 0
      # 基準日時の決定
      # 最初の生成時：start_generation_atを使用
      # 2回目以降：last_generated_atを使用
      base_time = routine_task.last_generated_at.present? ? routine_task.last_generated_at : routine_task.start_generation_at

      # 最初のタスク生成かどうかを判定
      is_first_generation = routine_task.last_generated_at.nil?

      actual_generate_count.times do |i|
        # 生成日時を計算（基準日時から間隔日数を加算）
        generation_date = base_time + ((i + 1) * routine_task.interval_days).days

        # 期限日時を計算
        # 最初のタスク生成時：開始日（start_generation_at）を基準
        # 2回目以降：生成日時を基準
        if is_first_generation && i == 0
          # 最初のタスクの場合は開始日を基準にする
          due_date = routine_task.calculate_due_date(routine_task.start_generation_at) || generation_date
        else
          # 2回目以降は生成日時を基準にする
          due_date = routine_task.calculate_due_date(generation_date) || generation_date
        end

        Task.create!(
          account_id: routine_task.account_id,
          routine_task_id: routine_task.id,
          title: routine_task.title,
          due_date: due_date,
          priority: routine_task.priority,
          category_id: routine_task.category_id,
          status: 'pending', # 習慣化タスクから生成されたタスクは常に未着手ステータス
          generated_at: generation_date
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
    # 未完了タスクを取得（論理削除済みを除く）
    incomplete_tasks = routine_task.tasks.where.not(status: 'completed').order(created_at: :asc)

    # max_active_tasksを超えている場合、古いタスクから論理削除
    excess_count = incomplete_tasks.count - routine_task.max_active_tasks
    if excess_count > 0
      tasks_to_delete = incomplete_tasks.limit(excess_count)
      tasks_to_delete.each(&:soft_delete)
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
