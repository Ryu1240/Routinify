module Api
  module V1
    class RoutineTasksController < BaseController
      def index
        validate_permissions([ 'read:routine-tasks' ]) do
          routine_tasks = RoutineTask.for_user(current_user_id).includes(:category)
          render_success(data: routine_tasks.map { |task| RoutineTaskSerializer.new(task).as_json })
        end
      end

      def show
        validate_permissions([ 'read:routine-tasks' ]) do
          routine_task = RoutineTask.find_by(id: params[:id], account_id: current_user_id)

          if routine_task
            render_success(data: RoutineTaskSerializer.new(routine_task).as_json)
          else
            render_not_found('習慣化タスク')
          end
        end
      end

      def create
        validate_permissions([ 'write:routine-tasks' ]) do
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

      def update
        validate_permissions([ 'write:routine-tasks' ]) do
          routine_task = RoutineTask.find_by(id: params[:id], account_id: current_user_id)
          return render_not_found('習慣化タスク') unless routine_task

          # 一度でも生成が行われた場合、start_generation_atは変更不可
          if routine_task.generated? && routine_task_params[:start_generation_at].present?
            if routine_task.start_generation_at.present? && routine_task_params[:start_generation_at] != routine_task.start_generation_at
              return render_error(errors: [ '開始期限は一度でも生成が行われると変更できません' ], status: :unprocessable_entity)
            end
          end

          if routine_task.update(routine_task_params)
            render_success(
              data: RoutineTaskSerializer.new(routine_task).as_json,
              message: I18n.t('messages.routine_task.updated', default: '習慣化タスクが正常に更新されました')
            )
          else
            render_error(errors: routine_task.errors.full_messages)
          end
        end
      end

      def destroy
        validate_permissions([ 'delete:routine-tasks' ]) do
          routine_task = RoutineTask.find_by(id: params[:id], account_id: current_user_id)
          return render_not_found('習慣化タスク') unless routine_task

          if routine_task.destroy
            head :no_content
          else
            render_error(errors: routine_task.errors.full_messages, status: :unprocessable_entity)
          end
        end
      end

      def generate
        validate_permissions([ 'write:routine-tasks' ]) do
          routine_task = RoutineTask.find_by(id: params[:id], account_id: current_user_id)
          return render_not_found('習慣化タスク') unless routine_task

          # ジョブIDを生成
          job_id = SecureRandom.uuid

          # ジョブ初期ステータスをRedisに保存
          redis = Redis.new(url: ENV.fetch('REDIS_URL', 'redis://redis:6379/0'))
          initial_status = {
            jobId: job_id,
            status: 'pending',
            completed: false,
            createdAt: Time.current.iso8601
          }
          redis.setex("job_status:#{job_id}", 24.hours.to_i, initial_status.to_json)
          redis.close

          # ジョブをキューに投入
          RoutineTaskGeneratorJob.perform_later(routine_task.id, job_id)

          # 202 Acceptedとジョブ情報を返却
          render json: {
            success: true,
            data: { jobId: job_id }
          }, status: :accepted
        end
      end

      def generation_status
        validate_permissions([ 'read:routine-tasks' ]) do
          routine_task = RoutineTask.find_by(id: params[:id], account_id: current_user_id)
          return render_not_found('習慣化タスク') unless routine_task

          job_id = params[:job_id]
          return render_error(errors: [ 'job_idパラメータが必要です' ], status: :bad_request) if job_id.blank?

          # Redisからジョブステータスを取得
          redis = Redis.new(url: ENV.fetch('REDIS_URL', 'redis://redis:6379/0'))
          job_status_json = redis.get("job_status:#{job_id}")
          redis.close

          if job_status_json.nil?
            return render_error(errors: [ '指定されたジョブが見つかりません' ], status: :not_found)
          end

          job_status = JSON.parse(job_status_json, symbolize_names: true)
          render_success(data: job_status)
        end
      end

      def achievement_stats
        validate_permissions([ 'read:routine-tasks' ]) do
          routine_task = RoutineTask.find_by(id: params[:id], account_id: current_user_id)
          return render_not_found('習慣化タスク') unless routine_task

          # パラメータの取得と変換
          achievement_params = achievement_stats_params
          return if performed? # バリデーションエラーで既にレスポンスを返している場合

          # サービスを呼び出し
          service = RoutineTaskAchievementService.new(
            routine_task,
            period: achievement_params[:period],
            start_date: achievement_params[:start_date],
            end_date: achievement_params[:end_date]
          )

          result = service.calculate

          if result.success?
            render_success(data: result.data)
          else
            render_error(errors: result.errors, status: result.status)
          end
        end
      end

      def achievement_trend
        validate_permissions([ 'read:routine-tasks' ]) do
          routine_task = RoutineTask.find_by(id: params[:id], account_id: current_user_id)
          return render_not_found('習慣化タスク') unless routine_task

          # パラメータの取得と変換
          trend_params = achievement_trend_params
          return if performed? # バリデーションエラーで既にレスポンスを返している場合

          # サービスを呼び出し
          service = RoutineTaskAchievementTrendService.new(
            routine_task,
            period: trend_params[:period],
            weeks: trend_params[:weeks],
            months: trend_params[:months]
          )

          result = service.call

          if result.success?
            render_success(data: result.data)
          else
            render_error(errors: result.errors, status: result.status)
          end
        end
      end

      private

      def routine_task_params
        params.require(:routine_task).permit(:title, :frequency, :interval_value, :next_generation_at, :max_active_tasks, :category_id, :priority, :is_active, :due_date_offset_days, :due_date_offset_hour, :start_generation_at)
      end

      def achievement_stats_params
        period = params[:period] || 'weekly'
        start_date = params[:start_date]
        end_date = params[:end_date]

        # periodのバリデーション
        unless %w[weekly monthly custom].include?(period)
          render_error(
            errors: [ 'periodはweekly、monthly、customのいずれかである必要があります' ],
            status: :bad_request
          )
          return {}
        end

        # custom期間の場合、start_dateとend_dateが必須
        if period == 'custom'
          if start_date.blank? || end_date.blank?
            render_error(
              errors: [ 'periodがcustomの場合、start_dateとend_dateは必須です' ],
              status: :bad_request
            )
            return {}
          end
        end

        # start_dateとend_dateが指定されている場合、日付としてパース
        if start_date.present? && end_date.present?
          begin
            start_date = Date.parse(start_date)
            end_date = Date.parse(end_date)
          rescue ArgumentError
            render_error(
              errors: [ 'start_dateとend_dateは有効な日付形式である必要があります' ],
              status: :bad_request
            )
            return {}
          end

          # start_dateがend_dateより前であることを確認
          if start_date > end_date
            render_error(
              errors: [ 'start_dateはend_dateより前である必要があります' ],
              status: :bad_request
            )
            return {}
          end
        end

        {
          period: period,
          start_date: start_date,
          end_date: end_date
        }
      end

      def achievement_trend_params
        period = params[:period]
        weeks = params[:weeks] || 4
        months = params[:months] || 3

        # periodのバリデーション
        unless %w[weekly monthly].include?(period)
          render_error(
            errors: ['periodはweeklyまたはmonthlyである必要があります'],
            status: :bad_request
          )
          return {}
        end

        # weeksのバリデーション（週次の場合）
        if period == 'weekly'
          weeks = weeks.to_i
          if weeks < 1 || weeks > 52
            render_error(
              errors: ['weeksは1以上52以下である必要があります'],
              status: :bad_request
            )
            return {}
          end
        end

        # monthsのバリデーション（月次の場合）
        if period == 'monthly'
          months = months.to_i
          if months < 1 || months > 24
            render_error(
              errors: ['monthsは1以上24以下である必要があります'],
              status: :bad_request
            )
            return {}
          end
        end

        {
          period: period,
          weeks: weeks,
          months: months
        }
      end
    end
  end
end
