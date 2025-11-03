# frozen_string_literal: true

module Api
  module V1
    class AuthController < BaseController
      skip_before_action :authorize, only: [ :login ]

      def login
        auth0_token = params[:auth0_token]

        if auth0_token.blank?
          return render_error(
            errors: [ 'auth0_token is required' ],
            message: 'auth0_token is required',
            status: :bad_request
          )
        end

        result = AuthService.authenticate(auth0_token)

        if result[:success]
          render_success(data: result[:data])
        else
          render_error(
            errors: [ result[:error] ],
            message: result[:error],
            status: :unauthorized
          )
        end
      end

      def logout
        # Auth0 JWT検証は authorize で完了（既存のSecuredモジュールを使用）
        
        # リフレッシュトークンが提供されている場合は無効化を試行
        refresh_token = params[:refresh_token]
        
        if refresh_token.present?
          begin
            # Auth0のリフレッシュトークンを無効化
            revoked = Auth0ManagementClient.revoke_refresh_token(refresh_token)
            
            if revoked
              Rails.logger.info("Refresh token revoked successfully for user: #{current_user_id}")
            else
              Rails.logger.warn("Failed to revoke refresh token for user: #{current_user_id}")
              # 無効化に失敗してもログアウト処理は続行（JWTは期限切れまで有効だが、
              # リフレッシュトークンが無効化されていれば新しいトークンは取得できない）
            end
          rescue StandardError => e
            Rails.logger.error("Error revoking refresh token: #{e.message}")
            Rails.logger.error(e.backtrace.join("\n"))
            # エラーが発生してもログアウト処理は続行
          end
        else
          Rails.logger.info("Logout requested without refresh token for user: #{current_user_id}")
        end
        
        # 注意: JWTアクセストークン自体は無効化できません（JWTはステートレス）
        # ただし、リフレッシュトークンを無効化することで、新しいトークンの取得を防げます
        # アクセストークンは期限切れまで有効ですが、期限は通常短い（例: 1時間）です
        
        render_success(message: 'Logged out successfully')
      end

      def me
        # @decoded_tokenはSecuredモジュールで設定済み（Auth0 JWT）
        token_data = @decoded_token.token[0]
        user_id = token_data['sub']
        email = token_data['email'] || token_data['https://routinify.com/email']

        # Management APIからロール情報を取得
        roles = Auth0ManagementClient.get_user_roles(user_id)

        user_info = {
          id: user_id,
          email: email,
          roles: roles
        }

        render_success(data: { user: user_info })
      end
    end
  end
end
