# frozen_string_literal: true

module Api
  module V1
    module Admin
      class UsersController < BaseController
        def index
          validate_permissions([ 'read:users' ]) do
            list_params_hash = list_params.to_h.symbolize_keys
            users_response = Auth0ManagementClient.list_users(list_params_hash)

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

            render_success(data: response_data)
          end
        end

        def destroy
          validate_permissions([ 'delete:users' ]) do
            user_id = params[:id]

            # 自分自身の削除を防ぐ
            if user_id == current_user_id
              return render_error(
                errors: [ '自分自身のアカウントは削除できません' ],
                message: '自分自身のアカウントは削除できません',
                status: :forbidden
              )
            end

            begin
              # 削除前にユーザーの存在確認
              user = Auth0ManagementClient.get_user(user_id)
              unless user
                return render_error(
                  errors: [ '指定されたユーザーが見つかりません' ],
                  message: '指定されたユーザーが見つかりません',
                  status: :not_found
                )
              end

              result = Auth0ManagementClient.delete_user(user_id)

              case result
              when true
                # 削除成功
                render_success(status: :no_content)
              when :not_found
                # ユーザーが見つからない（削除時にも404が返った場合）
                render_error(
                  errors: [ '指定されたユーザーが見つかりません' ],
                  message: '指定されたユーザーが見つかりません',
                  status: :not_found
                )
              else
                # その他のエラー
                render_error(
                  errors: [ 'アカウントの削除に失敗しました' ],
                  message: 'アカウントの削除に失敗しました',
                  status: :unprocessable_entity
                )
              end
            rescue StandardError => e
              Rails.logger.error "Error deleting user #{user_id}: #{e.class} - #{e.message}"
              Rails.logger.error e.backtrace.join("\n")

              render_error(
                errors: [ 'アカウントの削除中にエラーが発生しました' ],
                message: 'アカウントの削除中にエラーが発生しました',
                status: :internal_server_error
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
