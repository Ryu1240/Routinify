module Api
  module V1
    class RoutineTasksController < BaseController
      def index
        validate_permissions(['read:routine-tasks']) do
          routine_tasks = RoutineTask.for_user(current_user_id).includes(:category)
          render_success(data: routine_tasks.map { |task| RoutineTaskSerializer.new(task).as_json })
        end
      end

      def create
        validate_permissions(['write:routine-tasks']) do
          routine_task = RoutineTask.new(routine_task_params.merge(account_id: current_user_id))

          if routine_task.save
            render_success(
              data: RoutineTaskSerializer.new(routine_task).as_json,
              message: I18n.t('messages.routine_task.created', default: '習慣化タスクが正常に作成されました'),
              status: :created
            )
          else
            render_error(errors: routine_task.errors.full_messages)
          end
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

      private

      def routine_task_params
        params.require(:routine_task).permit(:title, :frequency, :interval_value, :next_generation_at, :max_active_tasks, :category_id, :priority, :is_active)
      end
    end
  end
end
