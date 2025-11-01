class MilestoneSerializer < BaseSerializer
  def as_json
    stats = @object.task_statistics
    {
      id: @object.id,
      accountId: @object.account_id,
      name: @object.name,
      description: @object.description,
      startDate: format_date(@object.start_date),
      dueDate: format_date(@object.due_date),
      status: @object.status,
      completedAt: format_datetime(@object.completed_at),
      progressPercentage: stats[:progress_percentage],
      totalTasksCount: stats[:total_tasks_count],
      completedTasksCount: stats[:completed_tasks_count],
      createdAt: format_datetime(@object.created_at),
      updatedAt: format_datetime(@object.updated_at)
    }
  end
end
