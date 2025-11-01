class MilestoneSerializer < BaseSerializer
  def as_json
    {
      id: @object.id,
      accountId: @object.account_id,
      name: @object.name,
      description: @object.description,
      startDate: format_date(@object.start_date),
      dueDate: format_date(@object.due_date),
      status: @object.status,
      completedAt: format_datetime(@object.completed_at),
      progressPercentage: @object.progress_percentage,
      totalTasksCount: @object.total_tasks_count,
      completedTasksCount: @object.completed_tasks_count,
      createdAt: format_datetime(@object.created_at),
      updatedAt: format_datetime(@object.updated_at)
    }
  end
end

