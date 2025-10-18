module ResponseFormatter
  extend ActiveSupport::Concern

  private

  def render_success(data: nil, message: nil, status: :ok)
    response = { success: true }
    response[:data] = data if data
    response[:message] = message if message
    render json: response, status: status
  rescue => e
    Rails.logger.error "Error in render_success: #{e.message}"
    Rails.logger.error e.backtrace.join("\n")
    raise e
  end

  def render_error(errors:, message: nil, status: :unprocessable_entity)
    response = { success: false, errors: errors }
    response[:message] = message if message
    render json: response, status: status
  end

  def render_not_found(resource_name)
    render_error(
      errors: [I18n.t('errors.not_found', resource: resource_name, default: "#{resource_name}が見つかりません")],
      status: :not_found
    )
  end

  def format_datetime(datetime)
    datetime&.iso8601
  end

  def format_date(date)
    date&.iso8601
  end

  def json_response
    @json_response ||= JSON.parse(response.body)
  end
end
