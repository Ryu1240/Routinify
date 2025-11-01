class MilestoneCreateService < BaseService
  def initialize(account_id:, milestone_params:)
    @account_id = account_id
    @milestone_params = milestone_params
  end

  def call
    milestone = Milestone.new(milestone_params_with_defaults)

    if milestone.save
      ServiceResult.success(
        data: milestone,
        message: I18n.t('messages.milestone.created', default: 'マイルストーンが正常に作成されました'),
        status: :created
      )
    else
      ServiceResult.error(
        errors: milestone.errors.full_messages,
        status: :unprocessable_entity
      )
    end
  rescue StandardError => e
    log_error(e, { account_id: @account_id, milestone_params: @milestone_params })
    ServiceResult.error(
      errors: [ 'マイルストーンの作成に失敗しました' ],
      status: :internal_server_error
    )
  end

  private

  def milestone_params_with_defaults
    @milestone_params.merge(
      account_id: @account_id,
      status: @milestone_params[:status] || 'planning'
    )
  end
end
