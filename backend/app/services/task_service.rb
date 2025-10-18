class TaskService < BaseService
  def initialize(user_id)
    @user_id = user_id
  end

  # 複雑なビジネスロジックのみをサービス層に配置
  # 例：バッチ処理、複雑な検索、外部API連携など

  def bulk_create(tasks_params)
    return ServiceResult.error(errors: ['タスクが指定されていません'], message: 'タスクが指定されていません') if tasks_params.empty?

    results = []
    errors = []

    tasks_params.each_with_index do |params, index|
      task = Task.new(params.merge(account_id: @user_id))

      if task.save
        results << TaskSerializer.new(task).as_json
      else
        errors << { index: index, errors: task.errors.full_messages }
      end
    end

    if errors.empty?
      ServiceResult.success(data: results, message: "#{results.count}件のタスクを作成しました")
    else
      ServiceResult.error(errors: errors, message: "一部のタスクの作成に失敗しました")
    end
  end

  def search_with_analytics(query, filters = {})
    # 複雑な検索ロジック
    tasks = Task.for_user(@user_id)
    tasks = apply_advanced_filters(tasks, filters)
    tasks = tasks.search(query) if query.present?
    
    # 検索結果の分析
    analytics = {
      total_count: tasks.count,
      by_status: tasks.group(:status).count,
      by_priority: tasks.group(:priority).count,
      overdue_count: tasks.overdue.count
    }
    
    ServiceResult.success(
      data: {
        tasks: tasks.map { |task| TaskSerializer.new(task).as_json },
        analytics: analytics
      }
    )
  end

  def send_notifications_for_overdue_tasks
    overdue_tasks = Task.for_user(@user_id).overdue.includes(:category)
    
    overdue_tasks.each do |task|
      # 通知送信ロジック（例：メール、Slack等）
      # TaskMailer.overdue_notification(task).deliver_now
      Rails.logger.info "期限切れタスク通知: #{task.title} (ID: #{task.id})"
    end
    
    ServiceResult.success(message: "#{overdue_tasks.count}件の期限切れタスクに通知を送信しました")
  end

  private

  def apply_advanced_filters(tasks, filters)
    tasks = tasks.by_status(filters[:status]) if filters[:status].present?
    tasks = tasks.overdue if filters[:overdue] == 'true'
    tasks = tasks.due_today if filters[:due_today] == 'true'
    tasks = tasks.where('created_at >= ?', filters[:created_after]) if filters[:created_after].present?
    tasks = tasks.where('created_at <= ?', filters[:created_before]) if filters[:created_before].present?
    tasks
  end
end
