class UserSerializer < BaseSerializer
  def as_json
    {
      sub: @object['user_id'] || @object['sub'],
      name: @object['name'],
      email: @object['email'],
      picture: @object['picture'],
      nickname: @object['nickname'],
      emailVerified: @object['email_verified'],
      createdAt: format_datetime(@object['created_at']),
      updatedAt: format_datetime(@object['updated_at']),
      lastLogin: format_datetime(@object['last_login']),
      loginsCount: @object['logins_count']
    }
  end
end

