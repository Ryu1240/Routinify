class MilestoneCreateService < BaseService
  ##
  # Initialize the service with the target account and milestone attributes.
  # @param [Integer] account_id - ID of the account that will own the milestone.
  # @param [Hash] milestone_params - Attributes used to build the Milestone (may be merged with defaults).
  def initialize(account_id:, milestone_params:)
    @account_id = account_id
    @milestone_params = milestone_params
  end

  ##
  # Create a Milestone record using the provided parameters merged with defaults.
  #
  # On success returns a ServiceResult containing the created milestone, a localized success message, and status `:created`.
  # On validation failure returns a ServiceResult containing the milestone's full error messages and status `:unprocessable_entity`.
  # On unexpected errors logs the exception and returns a ServiceResult containing a generic failure message and status `:internal_server_error`.
  # @return [ServiceResult] The result object describing success or failure and carrying data, messages, errors, and an HTTP status symbol.
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

  ##
  # Build milestone parameters with defaults applied.
  # Merges the instance's `@milestone_params` with `account_id` and a default `status` of `'planning'` when `:status` is not present.
  # @return [Hash] The merged parameters including `:account_id` and `:status`.
  def milestone_params_with_defaults
    @milestone_params.merge(
      account_id: @account_id,
      status: @milestone_params[:status] || 'planning'
    )
  end
end