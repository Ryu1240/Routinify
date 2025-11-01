module Api
  module V1
    class MilestonesController < BaseController
      def index
        validate_permissions([ 'read:milestones' ]) do
          milestones = Milestone.for_user(current_user_id).includes(:tasks)
          milestones = apply_filters(milestones, search_params)
          milestones = apply_sort(milestones, search_params)

          render_success(data: milestones.map { |milestone| MilestoneSerializer.new(milestone).as_json })
        end
      end

      def show
        validate_permissions([ 'read:milestones' ]) do
          milestone = Milestone.for_user(current_user_id).includes(:tasks).find_by(id: params[:id])

          if milestone
            render_success(data: MilestoneSerializer.new(milestone).as_json)
          else
            render_not_found('マイルストーン')
          end
        end
      end

      def create
        validate_permissions([ 'write:milestones' ]) do
          service = MilestoneCreateService.new(
            account_id: current_user_id,
            milestone_params: milestone_params.to_h
          )
          result = service.call

          if result.success?
            render_success(
              data: MilestoneSerializer.new(result.data).as_json,
              message: result.message,
              status: result.status
            )
          else
            render_error(errors: result.errors, status: result.status)
          end
        end
      end

      def update
        validate_permissions([ 'write:milestones' ]) do
          milestone = Milestone.for_user(current_user_id).find_by(id: params[:id])

          if milestone.nil?
            render_not_found('マイルストーン')
            return
          end

          service = MilestoneUpdateService.new(
            milestone: milestone,
            milestone_params: milestone_params.to_h
          )
          result = service.call

          if result.success?
            render_success(
              data: MilestoneSerializer.new(result.data).as_json,
              message: result.message,
              status: result.status
            )
          else
            render_error(errors: result.errors, status: result.status)
          end
        end
      end

      def destroy
        validate_permissions([ 'delete:milestones' ]) do
          milestone = Milestone.for_user(current_user_id).find_by(id: params[:id])

          if milestone.nil?
            render_not_found('マイルストーン')
            return
          end

          milestone.destroy
          head :no_content
        end
      end

      def associate_task
        validate_permissions([ 'write:milestones' ]) do
          milestone = Milestone.for_user(current_user_id).find_by(id: params[:id])

          if milestone.nil?
            render_not_found('マイルストーン')
            return
          end

          raw_task_ids = task_association_params[:task_ids]
          
          if raw_task_ids.nil? || (raw_task_ids.is_a?(Array) && raw_task_ids.empty?)
            render_error(errors: [ 'task_idsは必須です' ], status: :unprocessable_entity)
            return
          end

          task_ids = Array(raw_task_ids).compact.map(&:to_i).reject(&:zero?)

          if task_ids.empty?
            render_error(errors: [ 'task_idsは必須です' ], status: :unprocessable_entity)
            return
          end

          # タスクIDの検証
          tasks = Task.for_user(current_user_id).where(id: task_ids)

          if tasks.count != task_ids.count
            render_error(errors: [ '一部のタスクが見つかりません' ], status: :not_found)
            return
          end

          # 既に関連付けられているタスクを除外
          existing_task_ids = milestone.tasks.where(id: task_ids).pluck(:id)
          new_task_ids = task_ids - existing_task_ids

          if new_task_ids.empty?
            render_error(errors: [ 'すべてのタスクは既にマイルストーンに関連付けられています' ], status: :unprocessable_entity)
            return
          end

          # 新しいタスクを関連付け（重複を避けるため、個別に追加）
          new_tasks = tasks.where(id: new_task_ids)
          new_tasks.each do |task|
            begin
              milestone.tasks << task unless milestone.tasks.exists?(task.id)
            rescue ActiveRecord::RecordNotUnique
              # 既に関連付けられている場合はスキップ
              next
            end
          end

          render_success(
            data: MilestoneSerializer.new(milestone.reload).as_json,
            message: "#{new_task_ids.count}件のタスクをマイルストーンに関連付けました",
            status: :ok
          )
        end
      end

      def dissociate_task
        validate_permissions([ 'write:milestones' ]) do
          milestone = Milestone.for_user(current_user_id).find_by(id: params[:id])

          if milestone.nil?
            render_not_found('マイルストーン')
            return
          end

          raw_task_ids = task_association_params[:task_ids]
          
          if raw_task_ids.nil? || (raw_task_ids.is_a?(Array) && raw_task_ids.empty?)
            render_error(errors: [ 'task_idsは必須です' ], status: :unprocessable_entity)
            return
          end

          task_ids = Array(raw_task_ids).compact.map(&:to_i).reject(&:zero?)

          if task_ids.empty?
            render_error(errors: [ 'task_idsは必須です' ], status: :unprocessable_entity)
            return
          end

          # タスクIDの検証
          tasks = Task.for_user(current_user_id).where(id: task_ids)

          if tasks.count != task_ids.count
            render_error(errors: [ '一部のタスクが見つかりません' ], status: :not_found)
            return
          end

          # 関連付けられているタスクのみを取得
          associated_tasks = milestone.tasks.where(id: task_ids)
          associated_count = associated_tasks.count

          if associated_tasks.empty?
            render_error(errors: [ 'すべてのタスクはマイルストーンに関連付けられていません' ], status: :unprocessable_entity)
            return
          end

          # タスクの関連付けを解除
          milestone.tasks.delete(associated_tasks)

          render_success(
            data: MilestoneSerializer.new(milestone.reload).as_json,
            message: "#{associated_count}件のタスクの関連付けを解除しました",
            status: :ok
          )
        end
      end

      private

      def milestone_params
        params.require(:milestone).permit(:name, :description, :start_date, :due_date, :status)
      end

      def search_params
        params.permit(:status, :due_date_range, :q, :sort_by, :sort_order)
      end

      def task_association_params
        # { task: { task_ids: [1, 2, 3] } } 形式を試す
        if params[:task].present?
          params.require(:task).permit(task_ids: [])
        else
          # フォールバック: { task_ids: [1, 2, 3] } 形式
          params.permit(task_ids: [])
        end
      end

      def apply_filters(milestones, filters)
        milestones = milestones.by_status(filters[:status]) if filters[:status].present?
        milestones = apply_due_date_filter(milestones, filters[:due_date_range]) if filters[:due_date_range].present?
        milestones = milestones.search_by_name(filters[:q]) if filters[:q].present?
        milestones
      end

      def apply_due_date_filter(milestones, range)
        case range
        when 'overdue'
          milestones.overdue
        when 'today'
          milestones.due_today
        when 'this_week'
          milestones.due_this_week
        when 'this_month'
          milestones.due_this_month
        else
          milestones
        end
      end

      def apply_sort(milestones, filters)
        sort_by = filters[:sort_by] || 'created_at'
        sort_order = filters[:sort_order] || 'desc'

        case sort_by
        when 'created_at'
          milestones.order(created_at: sort_order.to_sym)
        when 'due_date'
          milestones.order(due_date: sort_order.to_sym)
        when 'progress'
          # 進捗率でソートする場合は、LEFT JOINとGROUP BYを使用して計算
          # serializerで使用するtask_statisticsメソッドが正しく動作するよう、includes(:tasks)を維持
          milestones.left_joins(:tasks)
            .select('milestones.*, COUNT(tasks.id) as total_tasks_count, COUNT(CASE WHEN tasks.status = \'completed\' THEN 1 END) as completed_tasks_count')
            .group('milestones.id')
            .order(Arel.sql("CASE WHEN COUNT(tasks.id) = 0 THEN 0 ELSE (COUNT(CASE WHEN tasks.status = 'completed' THEN 1 END)::float / COUNT(tasks.id) * 100) END #{sort_order.upcase}"))
            .includes(:tasks)
        else
          milestones.order(created_at: :desc)
        end
      end
    end
  end
end
