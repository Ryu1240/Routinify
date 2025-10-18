class BaseService

  class ServiceResult

    attr_reader :success, :data, :errors, :message, :status

    def initialize(success:, data: nil, errors: [], message: nil, status: :ok)
      @success = success
      @data = data
      @errors = errors
      @message = message
      @status = status
    end

    def self.success(data: nil, message: nil, status: :ok)
      new(success: true, data: data, message: message, status: status)
    end

    def self.error(errors: [], message: nil, status: :unprocessable_entity)
      new(success: false, errors: errors, message: message, status: status)
    end

    def success?
      @success
    end

    def error?
      !@success
    end

  end

  private

  def log_error(error, context = {})
    Rails.logger.error "#{self.class.name}: #{error.message}"
    Rails.logger.error "Context: #{context}" if context.any?
    Rails.logger.error error.backtrace.join("\n")
  end

end
