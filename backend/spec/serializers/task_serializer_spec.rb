require 'rails_helper'

RSpec.describe TaskSerializer do
  let(:category) { create(:category, name: 'テストカテゴリ') }
  let(:task) do
    create(:task,
           title: 'テストタスク',
           due_date: 1.week.from_now,
           status: '未着手',
           priority: 'medium',
           category: category)
  end
  let(:serializer) { described_class.new(task) }

  describe '#as_json' do
    it '正しい形式でシリアライズされる' do
      result = serializer.as_json

      expect(result).to include(
        id: task.id,
        accountId: task.account_id,
        title: 'テストタスク',
        status: '未着手',
        priority: 'medium',
        categoryId: category.id,
        categoryName: 'テストカテゴリ'
      )
    end

    it '日付が正しい形式でフォーマットされる' do
      result = serializer.as_json

      expect(result[:dueDate]).to eq(task.due_date.iso8601)
      expect(result[:createdAt]).to eq(task.created_at.iso8601)
      expect(result[:updatedAt]).to eq(task.updated_at.iso8601)
    end

    it 'due_dateがnilの場合も正しく処理される' do
      task.update!(due_date: nil)
      result = serializer.as_json

      expect(result[:dueDate]).to be_nil
    end

    it 'カテゴリがない場合も正しく処理される' do
      task.update!(category: nil)
      result = serializer.as_json

      expect(result[:categoryId]).to be_nil
      expect(result[:categoryName]).to be_nil
    end

    it 'overdueとcompletedの状態が正しく計算される' do
      task.update_column(:due_date, 1.day.ago)
      task.update_column(:status, '完了')
      result = serializer.as_json

      expect(result[:overdue]).to be true
      expect(result[:completed]).to be true
    end
  end
end
