module Api
  module V1
    class TasksController < ApplicationController
      def index
        validate_permissions([ 'read:tasks' ]) do
          user_id = current_user_id
          tasks = Task.for_user(user_id).includes(:category)
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
            render json: { message: 'タスクが正常に作成されました' }, status: :created
          else
            render json: { errors: task.errors.full_messages }, status: :unprocessable_entity
          end
        end
      end

      def show
        validate_permissions([ 'read:tasks' ]) do
          user_id = current_user_id
          task = Task.find_by(id: params[:id], account_id: user_id)

          if task.nil?
            render json: { errors: [ 'タスクが見つかりません' ] }, status: :not_found
            return
          end

          render json: {
            data: format_task_response(task)
          }, status: :ok
        end
      end

      def update
        validate_permissions([ 'write:tasks' ]) do
          user_id = current_user_id
          task = Task.find_by(id: params[:id], account_id: user_id)

          if task.nil?
            render json: { errors: [ 'タスクが見つかりません' ] }, status: :not_found
            return
          end

          if task.update(task_params)
            render json: { message: 'タスクが正常に更新されました' }, status: :ok
          else
            render json: { errors: task.errors.full_messages }, status: :unprocessable_entity
          end
        end
      end

      def destroy
        validate_permissions([ 'delete:tasks' ]) do
          user_id = current_user_id
          task = Task.find_by(id: params[:id], account_id: user_id)

          if task.nil?
            render json: { errors: [ 'タスクが見つかりません' ] }, status: :not_found
            return
          end

          task.destroy
          head :no_content
        end
      end

      private

      def task_params
        params.require(:task).permit(:title, :due_date, :status, :priority, :category_id)
      end

      def format_task_response(task)
        {
          id: task.id,
          accountId: task.account_id,
          title: task.title,
          dueDate: task.due_date&.iso8601,
          status: task.status,
          priority: task.priority,
          categoryId: task.category_id,
          createdAt: task.created_at.iso8601(3),
          updatedAt: task.updated_at.iso8601(3)
        }
      end
    end
  end
end
