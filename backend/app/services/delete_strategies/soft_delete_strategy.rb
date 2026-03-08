# frozen_string_literal: true

module DeleteStrategies
  # 論理削除戦略: deleted_atを設定する
  # 習慣化タスク由来のタスクに適用（達成状況統計の更新をトリガーするため）
  class SoftDeleteStrategy < BaseStrategy
    def execute(task)
      task.update(deleted_at: Time.current)
    end
  end
end
