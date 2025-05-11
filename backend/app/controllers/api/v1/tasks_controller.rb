module Api
  module V1
    class TasksController < ApplicationController
      def index
        # TODO: タスク一覧を取得する処理を実装
        render json: { message: "タスク一覧を取得するエンドポイント" }
      end
    end
  end
end
