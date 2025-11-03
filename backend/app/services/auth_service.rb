# frozen_string_literal: true

class AuthService
  class << self
    def authenticate(auth0_token)
      # 1. Auth0トークンを検証
      auth0_response = Auth0Client.validate_token(auth0_token)

      unless auth0_response.decoded_token
        status = auth0_response.error&.status || :unauthorized
        return error_response('Invalid Auth0 token', status)
      end

      # デコードされたトークンデータを取得
      token_data = auth0_response.decoded_token.token[0]
      user_id = token_data['sub']
      email = token_data['email'] || token_data['https://routinify.com/email']

      # 2. ロール情報を取得
      roles = fetch_user_roles(user_id)

      # 3. ロールがない場合、デフォルトで"user"ロールを付与（新規サインアップユーザー用）
      if roles.empty?
        assign_default_role(user_id)
        roles = fetch_user_roles(user_id)
      end

      # 4. レスポンスデータを構築（カスタムJWTは発行しない）
      success_response(
        user: {
          id: user_id,
          email: email,
          roles: roles
        }
      )
    rescue StandardError => e
      Rails.logger.error("Authentication error: #{e.message}")
      Rails.logger.error(e.backtrace.join("\n"))
      error_response('Authentication failed', :internal_server_error)
    end

    private

    def fetch_user_roles(user_id)
      Auth0ManagementClient.get_user_roles(user_id)
    rescue StandardError => e
      Rails.logger.warn("Failed to fetch user roles: #{e.message}")
      [] # フォールバック: 空配列
    end

    def assign_default_role(user_id)
      default_role = 'user'
      success = Auth0ManagementClient.assign_role_to_user(user_id, default_role)
      if success
        Rails.logger.info("Assigned default role '#{default_role}' to user #{user_id}")
      else
        Rails.logger.warn("Failed to assign default role '#{default_role}' to user #{user_id}")
      end
    rescue StandardError => e
      Rails.logger.error("Error assigning default role: #{e.message}")
    end

    def success_response(data)
      {
        success: true,
        data: data
      }
    end

    def error_response(message, status = :unauthorized)
      {
        success: false,
        error: message,
        status: status
      }
    end
  end
end
