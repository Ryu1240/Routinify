require 'rails_helper'

RSpec.describe TaskService do
  let(:user_id) { 'test-user-id' }
  let(:service) { described_class.new(user_id) }
  let(:task) { create(:task, account_id: user_id) }

  describe '#send_notifications_for_overdue_tasks' do
    let!(:overdue_task1) do
      task = build(:task, account_id: user_id, due_date: 1.day.ago, status: 'pending')
      task.save!(validate: false)
      task
    end
    let!(:overdue_task2) do
      task = build(:task, account_id: user_id, due_date: 2.days.ago, status: 'in_progress')
      task.save!(validate: false)
      task
    end
    let!(:current_task) { create(:task, account_id: user_id, due_date: 1.day.from_now, status: 'pending') }

    it '期限切れタスクに通知を送信する' do
      # ログのモック
      allow(Rails.logger).to receive(:info)

      result = service.send_notifications_for_overdue_tasks

      expect(result.success?).to be true
      expect(result.message).to eq('2件の期限切れタスクに通知を送信しました')
      expect(Rails.logger).to have_received(:info).with("期限切れタスク通知: #{overdue_task1.title} (ID: #{overdue_task1.id})")
      expect(Rails.logger).to have_received(:info).with("期限切れタスク通知: #{overdue_task2.title} (ID: #{overdue_task2.id})")
    end

    it '期限切れタスクがない場合は0件のメッセージを返す' do
      Task.where(account_id: user_id).update_all(due_date: 1.day.from_now)

      result = service.send_notifications_for_overdue_tasks

      expect(result.success?).to be true
      expect(result.message).to eq('0件の期限切れタスクに通知を送信しました')
    end
  end
end
