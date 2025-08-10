module Api
  module V1
    class TasksController < ApplicationController
      def index
        validate_permissions([ 'read:tasks' ]) do
          user_id = current_user_id
          tasks = Task.for_user(user_id)
          render json: {
            data: tasks.map { |task| format_task_response(task) }
          }, status: :ok
        end
      end

      def create
        validate_permissions([ 'write:tasks' ]) do
          user_id = current_user_id
          task = Task.new(task_params.merge(account_id: user_id))

          if task.save
            render json: { message: "タスクが正常に作成されました" }, status: :created
          else
            render json: { errors: task.errors.full_messages }, status: :unprocessable_entity
          end
        end
      end

      private

      def task_params
        params.require(:task).permit(:title, :due_date, :status, :priority, :category)
      end

      def format_task_response(task)
        task.as_json(
          only: [ :id, :account_id, :title, :due_date, :status, :priority, :category, :created_at, :updated_at ]
        ).transform_keys { |k| k.to_s.camelize(:lower) }
      end
    end
  end
end
