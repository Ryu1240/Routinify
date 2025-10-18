module Api
  module V1
    class TasksController < BaseController
      def index
        validate_permissions(['read:tasks']) do
          tasks = Task.for_user(current_user_id).includes(:category)
          tasks = apply_filters(tasks, search_params)
          
          render_success(data: tasks.map { |task| TaskSerializer.new(task).as_json })
        end
      end

      def create
        validate_permissions(['write:tasks']) do
          task = Task.new(task_params.merge(account_id: current_user_id))
          
          if task.save
            render_success(
              data: TaskSerializer.new(task).as_json,
              message: I18n.t('messages.task.created', default: 'タスクが正常に作成されました'),
              status: :created
            )
          else
            render_error(errors: task.errors.full_messages)
          end
        end
      end

      def show
        validate_permissions(['read:tasks']) do
          task = Task.find_by(id: params[:id], account_id: current_user_id)
          
          if task
            render_success(data: TaskSerializer.new(task).as_json)
          else
            render_not_found('タスク')
          end
        end
      end

      def update
        validate_permissions(['write:tasks']) do
          task = Task.find_by(id: params[:id], account_id: current_user_id)
          return render_not_found('タスク') unless task

          if task.update(task_params)
            render_success(
              data: TaskSerializer.new(task).as_json,
              message: I18n.t('messages.task.updated', default: 'タスクが正常に更新されました')
            )
          else
            render_error(errors: task.errors.full_messages)
          end
        end
      end

      def destroy
        validate_permissions(['delete:tasks']) do
          task = Task.find_by(id: params[:id], account_id: current_user_id)
          return render_not_found('タスク') unless task

          task.destroy
          render_success(
            message: I18n.t('messages.task.deleted', default: 'タスクが正常に削除されました'),
            status: :no_content
          )
        end
      end

      # 複雑な処理の例：バッチ作成（サービス層を使用）
      def bulk_create
        validate_permissions(['write:tasks']) do
          result = TaskService.new(current_user_id).bulk_create(tasks_params)
          handle_service_result(result)
        end
      end

      # 複雑な処理の例：検索と分析（サービス層を使用）
      def search_with_analytics
        validate_permissions(['read:tasks']) do
          result = TaskService.new(current_user_id).search_with_analytics(
            params[:q], 
            search_params
          )
          handle_service_result(result)
        end
      end

      private

      def task_params
        params.require(:task).permit(:title, :due_date, :status, :priority, :category_id)
      end

      def search_params
        params.permit(:status, :overdue, :due_today, :q, :page, :per_page)
      end

      def tasks_params
        tasks = params.require(:tasks)
        return [] if tasks.empty?
        tasks.map { |task| task.is_a?(ActionController::Parameters) ? task.permit(:title, :due_date, :status, :priority, :category_id) : task }
      end

      def apply_filters(tasks, filters)
        tasks = tasks.by_status(filters[:status]) if filters[:status].present?
        tasks = tasks.overdue if filters[:overdue] == 'true'
        tasks = tasks.due_today if filters[:due_today] == 'true'
        tasks = tasks.search(filters[:q]) if filters[:q].present?
        tasks
      end

    end
  end
end
