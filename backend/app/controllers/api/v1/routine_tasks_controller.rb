module Api
  module V1
    class RoutineTasksController < BaseController
      def index
        validate_permissions(['read:routine-tasks']) do
          routine_tasks = RoutineTask.for_user(current_user_id).includes(:category)
          render_success(data: routine_tasks.map { |task| RoutineTaskSerializer.new(task).as_json })
        end
      end
    end
  end
end
