# frozen_string_literal: true

module Api
  module V1
    module Admin
      class UsersController < BaseController
        def index
          validate_permissions([ 'read:users' ]) do
            result = AdminUsersService.list(list_params)

            if result.success?
              render_success(data: result.data, status: result.status)
            else
              render_error(
                errors: result.errors,
                message: result.message,
                status: result.status
              )
            end
          end
        end

        def destroy
          validate_permissions([ 'delete:users' ]) do
            result = AdminUsersService.delete(
              user_id: params[:id],
              current_user_id: current_user_id
            )

            if result.success?
              # 204 No Contentの場合はレスポンスボディなし
              if result.status == :no_content
                head :no_content
              else
                render_success(data: result.data, status: result.status)
              end
            else
              render_error(
                errors: result.errors,
                message: result.message,
                status: result.status
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
