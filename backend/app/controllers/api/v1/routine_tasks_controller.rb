module Api
  module V1
    class RoutineTasksController < BaseController
      include PeriodParamsValidator
      def index
        validate_permissions([ 'read:routine-tasks' ]) do
          routine_tasks = RoutineTask.for_user(current_user_id).includes(:category)
          render_success(data: routine_tasks.map { |task| RoutineTaskSerializer.new(task).as_json })
        end
      end

      def show
        validate_permissions([ 'read:routine-tasks' ]) do
          routine_task = RoutineTask.find_by(id: params[:id], account_id: current_user_id)
          return render_not_found('習慣化タスク') unless routine_task

          render_success(data: RoutineTaskSerializer.new(routine_task).as_json)
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
          achievement_params = validate_achievement_period_params
          return unless achievement_params # バリデーションエラーで既にレスポンスを返している場合

          # サービスを呼び出し
          service = RoutineTaskAchievementService.new(
            routine_task,
            period: achievement_params[:period],
            start_date: achievement_params[:start_date],
            end_date: achievement_params[:end_date]
          )

          result = service.call

          if result.success?
            render_success(data: AchievementStatsSerializer.new(result.data).as_json)
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
          trend_params = validate_trend_period_params
          return unless trend_params # バリデーションエラーで既にレスポンスを返している場合

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

      def with_achievement_stats
        validate_permissions([ 'read:routine-tasks' ]) do
          period = validate_simple_period
          return unless period # バリデーションエラーで既にレスポンスを返している場合

          routine_tasks = RoutineTask.for_user(current_user_id)
                                    .where(is_active: true)
                                    .includes(:category, :achievement_statistics)

          today = Date.current
          period_start = period == 'weekly' ? today.beginning_of_week : today.beginning_of_month

          stats_by_rt = AchievementStatistic
            .where(routine_task_id: routine_tasks.map(&:id), period_type: period, period_start_date: period_start)
            .index_by(&:routine_task_id)

          data = routine_tasks.map do |rt|
            stat = stats_by_rt[rt.id]
            if stat
              achievement_stats = AchievementStatsSerializer.new(stat.to_achievement_stats_hash).as_json
            else
              UpdateAchievementStatisticsJob.perform_later(rt.id, period, period_start)
              achievement_stats = empty_achievement_stats(period, period_start)
            end

            {
              id: rt.id,
              title: rt.title,
              categoryName: rt.category&.name,
              achievementStats: achievement_stats
            }
          end

          render_success(data: data)
        end
      end

      private

      def empty_achievement_stats(period, period_start)
        period_end = period == 'weekly' ? period_start.end_of_week : period_start.end_of_month
        AchievementStatsSerializer.new({
          total_count: 0,
          completed_count: 0,
          incomplete_count: 0,
          overdue_count: 0,
          achievement_rate: 0,
          period: period,
          start_date: period_start.to_s,
          end_date: period_end.to_s,
          consecutive_periods_count: 0,
          average_completion_days: 0
        }).as_json
      end

      def routine_task_params
        params.require(:routine_task).permit(:title, :frequency, :interval_value, :next_generation_at, :max_active_tasks, :category_id, :priority, :is_active, :due_date_offset_days, :due_date_offset_hour, :start_generation_at)
      end
    end
  end
end
