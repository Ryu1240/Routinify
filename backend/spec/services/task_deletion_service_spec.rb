# frozen_string_literal: true

require 'rails_helper'

RSpec.describe TaskDeletionService do
  describe '#call' do
    context '習慣化タスクに紐づくタスクの場合' do
      let(:routine_task) { create(:routine_task) }
      let(:task) { create(:task, routine_task: routine_task, account_id: routine_task.account_id) }

      it '論理削除すること' do
        expect {
          described_class.new(task: task).call
        }.to change { Task.with_deleted.find(task.id).deleted_at }.from(nil).to(be_present)
      end

      it 'タスクはデータベースに残ること' do
        task_id = task.id
        described_class.new(task: task).call

        expect(Task.with_deleted.find_by(id: task_id)).to be_present
      end

      it 'ServiceResultで成功を返すこと' do
        result = described_class.new(task: task).call

        expect(result.success?).to be true
        expect(result.status).to eq(:no_content)
      end

      it 'activeスコープでは取得できないこと' do
        described_class.new(task: task).call

        expect(Task.active.find_by(id: task.id)).to be_nil
      end
    end

    context '習慣化タスクに紐づかないタスクの場合' do
      let(:task) { create(:task) }

      it '物理削除すること' do
        task_id = task.id
        described_class.new(task: task).call

        expect(Task.with_deleted.find_by(id: task_id)).to be_nil
      end

      it 'ServiceResultで成功を返すこと' do
        result = described_class.new(task: task).call

        expect(result.success?).to be true
        expect(result.status).to eq(:no_content)
      end
    end

    context '異常系' do
      let(:task) { create(:task) }

      it '削除時にエラーが発生した場合、ServiceResultでエラーを返すこと' do
        allow_any_instance_of(DeleteStrategies::HardDeleteStrategy).to receive(:execute).and_raise(StandardError, 'DB error')

        result = described_class.new(task: task).call

        expect(result.error?).to be true
        expect(result.errors).to include('タスクの削除に失敗しました')
        expect(result.status).to eq(:internal_server_error)
      end
    end
  end
end
