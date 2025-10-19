class TaskService < BaseService
  def initialize(user_id)
    @user_id = user_id
    # BaseServiceにはinitializeメソッドがないため、superは不要
  end

  # 複雑なビジネスロジックのみをサービス層に配置
  # 例：バッチ処理、複雑な検索、外部API連携など
  # 習慣化タスクのバッチ作成時活用予定（現時点では使用されていない）
  # def send_notifications_for_overdue_tasks
  #   overdue_tasks = Task.for_user(@user_id).overdue.includes(:category)

  #   overdue_tasks.each do |task|
  #     # 通知送信ロジック（例：メール、Slack等）
  #     # TaskMailer.overdue_notification(task).deliver_now
  #     Rails.logger.info "期限切れタスク通知: #{task.title} (ID: #{task.id})"
  #   end

  #   ServiceResult.success(message: "#{overdue_tasks.count}件の期限切れタスクに通知を送信しました")
  # end
end
