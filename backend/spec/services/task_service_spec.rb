require 'rails_helper'

RSpec.describe TaskService do
  let(:user_id) { 'test-user-id' }
  let(:service) { described_class.new(user_id) }
  let(:task) { create(:task, account_id: user_id) }

  describe '#bulk_create' do
    let(:valid_tasks_params) do
      [
        { title: 'タスク1', status: '未着手', priority: 'medium' },
        { title: 'タスク2', status: '進行中', priority: 'high' }
      ]
    end

    it '複数のタスクを作成できる' do
      result = service.bulk_create(valid_tasks_params)

      expect(result.success?).to be true
      expect(result.data.count).to eq(2)
      expect(result.message).to eq('2件のタスクを作成しました')
    end

    it '一部のタスクの作成に失敗した場合、エラーを返す' do
      invalid_tasks_params = [
        { title: 'タスク1', status: '未着手' },
        { title: '', status: '進行中' } # 無効なデータ
      ]

      result = service.bulk_create(invalid_tasks_params)

      expect(result.error?).to be true
      expect(result.errors).to be_present
      expect(result.message).to eq('一部のタスクの作成に失敗しました')
    end

    it '全てのタスクの作成に失敗した場合、エラーを返す' do
      invalid_tasks_params = [
        { title: '', status: '未着手' },
        { title: '', status: '進行中' }
      ]

      result = service.bulk_create(invalid_tasks_params)

      expect(result.error?).to be true
      expect(result.errors.count).to eq(2)
    end
  end

  describe '#search_with_analytics' do
    let!(:task1) { create(:task, account_id: user_id, title: 'テストタスク1', status: '未着手', priority: 'high') }
    let!(:task2) { create(:task, account_id: user_id, title: 'サンプルタスク2', status: '完了', priority: 'medium') }
    let!(:task3) { create(:task, account_id: user_id, title: 'テスト用タスク3', status: '未着手', priority: 'low') }

    it '検索結果と分析データを返す' do
      result = service.search_with_analytics('テスト')

      expect(result.success?).to be true
      expect(result.data[:tasks]).to be_an(Array)
      expect(result.data[:tasks].count).to eq(2)
      expect(result.data[:analytics]).to include(
        total_count: 2,
        by_status: { '未着手' => 2 },
        by_priority: { 'high' => 1, 'low' => 1 },
        overdue_count: 0
      )
    end

    it 'フィルタリングが動作する' do
      result = service.search_with_analytics('', status: '未着手')

      expect(result.success?).to be true
      expect(result.data[:tasks].count).to eq(2)
      expect(result.data[:analytics][:by_status]).to eq({ '未着手' => 2 })
    end

    it '検索クエリがない場合も動作する' do
      result = service.search_with_analytics('')

      expect(result.success?).to be true
      expect(result.data[:tasks].count).to eq(3)
    end
  end

  describe '#send_notifications_for_overdue_tasks' do
    let!(:overdue_task1) do
      task = build(:task, account_id: user_id, due_date: 1.day.ago, status: '未着手')
      task.save!(validate: false)
      task
    end
    let!(:overdue_task2) do
      task = build(:task, account_id: user_id, due_date: 2.days.ago, status: '進行中')
      task.save!(validate: false)
      task
    end
    let!(:current_task) { create(:task, account_id: user_id, due_date: 1.day.from_now, status: '未着手') }

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
