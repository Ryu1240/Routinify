# frozen_string_literal: true

module Api
  module V1
    module Admin
      class UsersController < BaseController
        def index
          validate_permissions(['read:users']) do
            list_params_hash = list_params.to_h.symbolize_keys
            users_response = Auth0ManagementClient.list_users(list_params_hash)

            # Auth0 Management APIのレスポンス形式に応じてデータを取得
            users = users_response.is_a?(Hash) && users_response['users'] ? users_response['users'] : users_response
            total = users_response.is_a?(Hash) && users_response['total'] ? users_response['total'] : nil
            start = users_response.is_a?(Hash) && users_response['start'] ? users_response['start'] : nil
            limit = users_response.is_a?(Hash) && users_response['limit'] ? users_response['limit'] : nil

            serialized_users = users.map { |user| UserSerializer.new(user).as_json }

            response_data = { users: serialized_users }
            response_data[:total] = total if total
            response_data[:start] = start if start
            response_data[:limit] = limit if limit

            render_success(data: response_data)
          end
        end

        def destroy
          validate_permissions(['delete:users']) do
            user_id = params[:id]

            # 自分自身の削除を防ぐ
            if user_id == current_user_id
              return render_error(
                errors: ['自分自身のアカウントは削除できません'],
                message: '自分自身のアカウントは削除できません',
                status: :forbidden
              )
            end

            result = Auth0ManagementClient.delete_user(user_id)

            if result
              render_success(
                message: 'アカウントが正常に削除されました',
                status: :no_content
              )
            else
              render_error(
                errors: ['アカウントの削除に失敗しました'],
                message: 'アカウントの削除に失敗しました',
                status: :unprocessable_entity
              )
            end
          end
        end

        private

        def list_params
          params.permit(:page, :per_page, :q, :sort, :order)
        end
      end
    end
  end
end

