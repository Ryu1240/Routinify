class MilestoneUpdateService < BaseService
  def initialize(milestone:, milestone_params:)
    @milestone = milestone
    @milestone_params = milestone_params
  end

  def call
    if @milestone.update(@milestone_params)
      ServiceResult.success(
        data: @milestone,
        message: I18n.t('messages.milestone.updated', default: 'マイルストーンが正常に更新されました'),
        status: :ok
      )
    else
      ServiceResult.error(
        errors: @milestone.errors.full_messages,
        status: :unprocessable_entity
      )
    end
  rescue StandardError => e
    log_error(e, { milestone_id: @milestone.id, milestone_params: @milestone_params })
    ServiceResult.error(
      errors: [ 'マイルストーンの更新に失敗しました' ],
      status: :internal_server_error
    )
  end
end

