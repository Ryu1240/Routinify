module Api
  module V1
    class TasksController < ApplicationController
      before_action :authorize
      def index
        validate_permissions(['read:tasks']) do 
          user_id = current_user_id
          tasks = Task.for_user(user_id)
          render json: { 
            data: tasks.map do |task|
              {
                id: task.id,
                accountId: task.accountId,
                title: task.title,
                dueDate: task.due_date,
                status: task.status,
                priority: task.priority,
                category: task.category,
                createdAt: task.created_at,
                updatedAt: task.updated_at
              }
            end
          }, status: :ok
        end
      end
    end
  end
end
