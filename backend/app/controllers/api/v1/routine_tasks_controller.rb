module Api
  module V1
    class RoutineTasksController < BaseController
      def index
        validate_permissions(['read:routine-tasks']) do
          routine_tasks = RoutineTask.for_user(current_user_id).includes(:category)
          render_success(data: routine_tasks.map { |task| RoutineTaskSerializer.new(task).as_json })
        end
      end

      def show
        validate_permissions(['read:routine-tasks']) do
          routine_task = RoutineTask.find_by(id: params[:id], account_id: current_user_id)

          if routine_task
            render_success(data: RoutineTaskSerializer.new(routine_task).as_json)
          else
            render_not_found('習慣化タスク')
          end
        end
      end
    end
  end
end
