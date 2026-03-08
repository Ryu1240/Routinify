class RoutineTaskGeneratorJob < ApplicationJob
  queue_as :default

  def perform(routine_task_id, job_id)
    job_status = JobStatusService.new
    job_status.update(job_id, status: 'running', completed: false)

    routine_task = RoutineTask.find(routine_task_id)
    current_time = Time.current

    if check_start_generation_at(routine_task, current_time)
      job_status.update(job_id, status: 'completed', completed: true, generated_tasks_count: 0, completed_at: current_time)
      return
    end

    tasks_to_generate = calculate_tasks_to_generate(routine_task, current_time)
    generated_count, generated_task_dates = generate_tasks(routine_task, tasks_to_generate, current_time)

    update_routine_task_after_generation(routine_task, current_time) if generated_count > 0

    deleted_task_dates = cleanup_excess_tasks(routine_task)
    schedule_achievement_statistics_updates(routine_task.id, generated_task_dates + deleted_task_dates)

    job_status.update(job_id, status: 'completed', completed: true, generated_tasks_count: generated_count, completed_at: current_time)
  rescue StandardError => e
    JobStatusService.new.update(job_id, status: 'failed', completed: true, error: e.message)
    raise e
  end

  private

  def check_start_generation_at(routine_task, current_time)
    current_time < routine_task.start_generation_at
  end

  def calculate_tasks_to_generate(routine_task, current_time)
    routine_task.tasks_to_generate_count(current_time)
  end

  def generate_tasks(routine_task, tasks_to_generate, current_time)
    return [ 0, [] ] if tasks_to_generate <= 0

    base_time = routine_task.calculate_base_time_for_generation(current_time)
    base_date = base_time.in_time_zone('Tokyo').to_date

    generated_count = 0
    generated_task_dates = []

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
      generated_count += 1
      generated_task_dates << generation_date.to_date
    end

    [ generated_count, generated_task_dates ]
  end

  def update_routine_task_after_generation(routine_task, current_time)
    routine_task.update!(
      last_generated_at: current_time,
      next_generation_at: routine_task.calculate_next_generation_at(current_time)
    )
  end

  def cleanup_excess_tasks(routine_task)
    routine_task.reload
    incomplete_tasks = routine_task.tasks.where.not(status: 'completed')
    excess_count = incomplete_tasks.count - routine_task.max_active_tasks
    return [] unless excess_count > 0

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

    deleted_dates = tasks_to_delete.filter_map { |t| (t.generated_at || t.created_at)&.to_date }
    Task.unscoped.where(id: tasks_to_delete.map(&:id)).update_all(deleted_at: Time.current)
    deleted_dates
  end

  def schedule_achievement_statistics_updates(routine_task_id, dates)
    return if dates.blank?

    period_pairs = dates.flat_map do |date|
      [
        [ 'weekly', date.beginning_of_week ],
        [ 'monthly', date.beginning_of_month ]
      ]
    end.uniq

    period_pairs.each do |period_type, period_start|
      UpdateAchievementStatisticsJob.perform_later(routine_task_id, period_type, period_start)
    end
  end
end
