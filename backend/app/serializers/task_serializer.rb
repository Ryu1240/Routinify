class TaskSerializer < BaseSerializer

  def as_json
    {
      id: @object.id,
      accountId: @object.account_id,
      title: @object.title,
      dueDate: format_datetime(@object.due_date),
      status: @object.status,
      priority: @object.priority,
      categoryId: @object.category_id,
      categoryName: @object.category&.name,
      overdue: @object.overdue?,
      completed: @object.completed?,
      createdAt: format_datetime(@object.created_at),
      updatedAt: format_datetime(@object.updated_at),
    }
  end

end
