class CategorySerializer < BaseSerializer
  def as_json
    {
      id: @object.id,
      accountId: @object.account_id,
      name: @object.name,
      createdAt: format_datetime(@object.created_at),
      updatedAt: format_datetime(@object.updated_at)
    }
  end
end
