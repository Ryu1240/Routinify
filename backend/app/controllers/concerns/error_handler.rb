module ErrorHandler
  extend ActiveSupport::Concern

  included do
    rescue_from StandardError, with: :handle_standard_error
    rescue_from ActiveRecord::RecordNotFound, with: :handle_record_not_found
    rescue_from ActiveRecord::RecordInvalid, with: :handle_record_invalid
    rescue_from ActionController::ParameterMissing, with: :handle_parameter_missing
  end

  private

  def handle_standard_error(exception)
    Rails.logger.error "Unexpected error: #{exception.message}"
    Rails.logger.error exception.backtrace.join("\n")
    
    render json: { 
      success: false, 
      errors: ['内部サーバーエラーが発生しました'] 
    }, status: :internal_server_error
  end

  def handle_record_not_found(exception)
    render json: { 
      success: false, 
      errors: ['リソースが見つかりません'] 
    }, status: :not_found
  end

  def handle_record_invalid(exception)
    render json: { 
      success: false, 
      errors: exception.record.errors.full_messages 
    }, status: :unprocessable_entity
  end

  def handle_parameter_missing(exception)
    render json: { 
      success: false, 
      errors: [exception.message] 
    }, status: :bad_request
  end

  def handle_service_result(result)
    if result.success?
      render_success(data: result.data, message: result.message, status: result.status)
    else
      render_error(errors: result.errors, message: result.message, status: result.status)
    end
  rescue => e
    Rails.logger.error "Error in handle_service_result: #{e.message}"
    Rails.logger.error e.backtrace.join("\n")
    raise e
  end
end
