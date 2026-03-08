# frozen_string_literal: true

class TaskDeletionService < BaseService
  def initialize(task:)
    @task = task
  end

  def call
    strategy = @task.routine_task_related? ? DeleteStrategies::SoftDeleteStrategy.new : DeleteStrategies::HardDeleteStrategy.new
    strategy.execute(@task)
    ServiceResult.success(status: :no_content)
  rescue StandardError => e
    log_error(e, { task_id: @task.id })
    ServiceResult.error(errors: [ 'タスクの削除に失敗しました' ], status: :internal_server_error)
  end
end
