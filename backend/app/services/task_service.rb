class TaskService < BaseService
  def initialize(user_id)
    @user_id = user_id
  end

  # 複雑なビジネスロジックのみをサービス層に配置
  # 例：バッチ処理、複雑な検索、外部API連携など

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
end
