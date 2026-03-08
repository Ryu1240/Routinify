# frozen_string_literal: true

module DeleteStrategies
  class BaseStrategy
    # @param task [Task] 削除対象のタスク
    # @return [Boolean] 削除が成功した場合true
    def execute(task)
      raise NotImplementedError, "#{self.class} must implement #execute(task)"
    end
  end
end
