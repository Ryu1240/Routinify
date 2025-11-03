# frozen_string_literal: true

class AdminUsersService < BaseService
  # ユーザー一覧を取得
  def self.list(params = {})
    params_hash = params.to_h.symbolize_keys
    users_response = Auth0ManagementClient.list_users(params_hash)

    # Auth0 Management APIのレスポンス形式に応じてデータを取得
    users = if users_response.is_a?(Hash) && users_response['users']
              users_response['users']
    elsif users_response.is_a?(Array)
              users_response
    else
              []
    end

    total = users_response.is_a?(Hash) ? users_response['total'] : nil
    start = users_response.is_a?(Hash) ? users_response['start'] : nil
    limit = users_response.is_a?(Hash) ? users_response['limit'] : nil

    serialized_users = users.map { |user| UserSerializer.new(user).as_json }

    response_data = { users: serialized_users }
    response_data[:total] = total if total
    response_data[:start] = start if start
    response_data[:limit] = limit if limit

    ServiceResult.success(data: response_data)
  rescue StandardError => e
    Rails.logger.error "AdminUsersService.list: #{e.class} - #{e.message}"
    Rails.logger.error e.backtrace.join("\n")

    ServiceResult.error(
      errors: [ 'ユーザーリストの取得に失敗しました' ],
      message: 'ユーザーリストの取得に失敗しました',
      status: :internal_server_error
    )
  end

  # ユーザーを削除
  def self.delete(user_id:, current_user_id:)
    # 自分自身の削除を防ぐ
    if user_id == current_user_id
      return ServiceResult.error(
        errors: [ '自分自身のアカウントは削除できません' ],
        message: '自分自身のアカウントは削除できません',
        status: :forbidden
      )
    end

    # 削除前にユーザーの存在確認
    user = Auth0ManagementClient.get_user(user_id)
    unless user
      return ServiceResult.error(
        errors: [ '指定されたユーザーが見つかりません' ],
        message: '指定されたユーザーが見つかりません',
        status: :not_found
      )
    end

    result = Auth0ManagementClient.delete_user(user_id)

    case result
    when true
      # 削除成功
      ServiceResult.success(status: :no_content)
    when :not_found
      # ユーザーが見つからない（削除時にも404が返った場合）
      ServiceResult.error(
        errors: [ '指定されたユーザーが見つかりません' ],
        message: '指定されたユーザーが見つかりません',
        status: :not_found
      )
    else
      # その他のエラー
      ServiceResult.error(
        errors: [ 'アカウントの削除に失敗しました' ],
        message: 'アカウントの削除に失敗しました',
        status: :unprocessable_entity
      )
    end
  rescue StandardError => e
    Rails.logger.error "AdminUsersService.delete: #{e.class} - #{e.message}"
    Rails.logger.error e.backtrace.join("\n")

    ServiceResult.error(
      errors: [ 'アカウントの削除中にエラーが発生しました' ],
      message: 'アカウントの削除中にエラーが発生しました',
      status: :internal_server_error
    )
  end
end
