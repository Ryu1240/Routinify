module Api
  module V1
    class TasksController < BaseController
      def index
        validate_permissions([ 'read:tasks' ]) do
          tasks = Task.for_user(current_user_id).includes(:category, :milestones)
          tasks = apply_base_scope(tasks, search_params)
          tasks = apply_filters(tasks, search_params)

          render_success(data: tasks.map { |task| TaskSerializer.new(task).as_json })
        end
      end

      def create
        validate_permissions([ 'write:tasks' ]) do
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
        validate_permissions([ 'read:tasks' ]) do
          task = Task.active.find_by(id: params[:id], account_id: current_user_id)

          if task
            render_success(data: TaskSerializer.new(task).as_json)
          else
            render_not_found('タスク')
          end
        end
      end

      def update
        validate_permissions([ 'write:tasks' ]) do
          task = Task.active.find_by(id: params[:id], account_id: current_user_id)
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
        validate_permissions([ 'delete:tasks' ]) do
          task = Task.with_deleted.find_by(id: params[:id], account_id: current_user_id)
          return render_not_found('タスク') unless task

          task.delete_task
          render_success(
            status: :no_content
          )
        end
      end

      private

      def task_params
        params.require(:task).permit(:title, :due_date, :status, :priority, :category_id)
      end

      def search_params
        params.permit(:status, :statuses, :overdue, :due_today, :q, :page, :per_page, :sort_by, :sort_order, :include_completed)
      end

      def apply_base_scope(tasks, filters)
        return tasks if ActiveModel::Type::Boolean.new.cast(filters[:include_completed])
        return tasks if filters[:status].present? || filters[:statuses].present?

        tasks.incomplete
      end

      def apply_filters(tasks, filters)
        # 複数ステータスフィルタリング（statusesパラメータが優先）
        if filters[:statuses].present?
          statuses = filters[:statuses].split(',').map(&:strip)
          tasks = tasks.by_statuses(statuses)
        elsif filters[:status].present?
          # 既存のstatusパラメータとの互換性を維持
          tasks = tasks.by_status(filters[:status])
        end

        tasks = tasks.overdue if filters[:overdue] == 'true'
        tasks = tasks.due_today if filters[:due_today] == 'true'
        tasks = tasks.search(filters[:q]) if filters[:q].present?

        # ソート処理
        tasks = apply_sort(tasks, filters)

        tasks
      end

      def apply_sort(tasks, filters)
        sort_by = filters[:sort_by]
        sort_order = filters[:sort_order]&.to_sym || :asc

        case sort_by
        when 'due_date'
          tasks.order_by_due_date(sort_order)
        when 'created_at'
          tasks.order(created_at: sort_order)
        when 'updated_at'
          tasks.order(updated_at: sort_order)
        else
          # デフォルトはcreated_atの降順
          tasks.order(created_at: :desc)
        end
      end
    end
  end
end
