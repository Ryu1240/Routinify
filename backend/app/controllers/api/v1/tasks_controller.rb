module Api
  module V1
    class TasksController < ApplicationController
      def index
        validate_permissions([ 'read:tasks' ]) do
          user_id = current_user_id
          tasks = Task.for_user(user_id)
          render json: {
            data: tasks.map do |task|
              task.as_json(
                only: [ :id, :account_id, :title, :due_date, :status, :priority, :category, :created_at, :updated_at ]
              ).transform_keys { |k| k.to_s.camelize(:lower) }
            end
          }, status: :ok
        end
      end
    end
  end
end
