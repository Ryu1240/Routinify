module Api
  module V1
    class TasksController < ApplicationController
      before_action :authorize
      def index
        validate_permissions(['read:tasks']) do
          scopes = @decoded_token.token[0]['scope']
          permissions = scopes.present? ? scopes.split(" ") : []
          render json: { 
            message: "タスク一覧を取得するエンドポイント",
            permissions: permissions 
          }
        end
      end
    end
  end
end
