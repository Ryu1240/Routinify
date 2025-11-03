class UserSerializer < BaseSerializer
  def as_json
    {
      sub: @object['user_id'] || @object['sub'],
      name: @object['name'],
      email: @object['email'],
      picture: @object['picture'],
      nickname: @object['nickname'],
      emailVerified: @object['email_verified'],
      createdAt: format_datetime_value(@object['created_at']),
      updatedAt: format_datetime_value(@object['updated_at']),
      lastLogin: format_datetime_value(@object['last_login']),
      loginsCount: @object['logins_count']
    }
  end

  private

  def format_datetime_value(value)
    return nil if value.nil?
    return value if value.is_a?(String)
    format_datetime(value)
  end
end
