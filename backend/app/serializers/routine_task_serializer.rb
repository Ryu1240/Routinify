class RoutineTaskSerializer < BaseSerializer
  def as_json
    {
      id: @object.id,
      accountId: @object.account_id,
      title: @object.title,
      frequency: @object.frequency,
      intervalValue: @object.interval_value,
      lastGeneratedAt: format_datetime(@object.last_generated_at),
      nextGenerationAt: format_datetime(@object.next_generation_at),
      maxActiveTasks: @object.max_active_tasks,
      categoryId: @object.category_id,
      categoryName: @object.category&.name,
      priority: @object.priority,
      isActive: @object.is_active,
      createdAt: format_datetime(@object.created_at),
      updatedAt: format_datetime(@object.updated_at)
    }
  end
end
