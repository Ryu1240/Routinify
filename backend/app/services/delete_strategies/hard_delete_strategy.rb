# frozen_string_literal: true

module DeleteStrategies
  # 物理削除戦略: データベースからレコードを削除する
  class HardDeleteStrategy < BaseStrategy
    def execute(task)
      task.destroy
    end
  end
end
