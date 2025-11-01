require 'rails_helper'

RSpec.describe Milestone, type: :model do
  describe 'associations' do
    it 'has many milestone_tasks' do
      milestone = Milestone.reflect_on_association(:milestone_tasks)
      expect(milestone.macro).to eq(:has_many)
    end

    it 'has many tasks through milestone_tasks' do
      milestone = Milestone.reflect_on_association(:tasks)
      expect(milestone.macro).to eq(:has_many)
      expect(milestone.options[:through]).to eq(:milestone_tasks)
    end
  end

  describe 'バリデーション' do
    subject { build(:milestone) }

    it '有効なファクトリを持つこと' do
      expect(subject).to be_valid
    end

    context 'name' do
      it 'nameが必須であること' do
        subject.name = nil
        expect(subject).to be_invalid
        expect(subject.errors[:name]).to be_present
      end

      it 'nameが空文字列の場合、無効であること' do
        subject.name = ''
        expect(subject).to be_invalid
        expect(subject.errors[:name]).to be_present
      end

      it 'nameが255文字以内であること' do
        subject.name = 'a' * 256
        expect(subject).to be_invalid
        expect(subject.errors[:name]).to be_present
      end
    end

    context 'account_id' do
      it 'account_idが必須であること' do
        subject.account_id = nil
        expect(subject).to be_invalid
        expect(subject.errors[:account_id]).to be_present
      end

      it 'account_idが空文字列の場合、無効であること' do
        subject.account_id = ''
        expect(subject).to be_invalid
        expect(subject.errors[:account_id]).to be_present
      end
    end

    context 'status' do
      it 'statusは必須であること' do
        subject.status = nil
        expect(subject).to be_invalid
        expect(subject.errors[:status]).to be_present
      end

      it '有効なstatus値を受け入れること' do
        %w[planning in_progress completed cancelled].each do |status|
          subject.status = status
          expect(subject).to be_valid
        end
      end

      it '無効なstatus値でエラーになること' do
        subject.status = '無効なステータス'
        expect(subject).to be_invalid
        expect(subject.errors[:status]).to be_present
      end

      it 'デフォルト値がplanningであること' do
        milestone = Milestone.new(name: 'Test Milestone', account_id: 'test_user')
        expect(milestone.status).to eq('planning')
      end
    end

    context 'description' do
      it 'descriptionは任意であること' do
        subject.description = nil
        expect(subject).to be_valid
      end

      it '有効なテキストを受け入れること' do
        subject.description = 'マイルストーンの説明'
        expect(subject).to be_valid
      end
    end

    context 'start_date' do
      it 'start_dateは任意であること' do
        subject.start_date = nil
        expect(subject).to be_valid
      end

      it '有効な日付形式を受け入れること' do
        subject.start_date = Date.current
        expect(subject).to be_valid
      end
    end

    context 'completed_at' do
      it 'completed_atは任意であること' do
        subject.completed_at = nil
        expect(subject).to be_valid
      end

      it '有効な日時形式を受け入れること' do
        subject.completed_at = Time.current
        expect(subject).to be_valid
      end
    end
  end

  describe 'スコープ' do
    let!(:user1_milestone1) { create(:milestone, account_id: 'user1', status: 'planning') }
    let!(:user1_milestone2) { create(:milestone, account_id: 'user1', status: 'in_progress') }
    let!(:user2_milestone) { create(:milestone, account_id: 'user2', status: 'completed') }
    let(:test_milestones) { Milestone.where(id: [user1_milestone1.id, user1_milestone2.id, user2_milestone.id]) }

    describe '.by_account' do
      it '指定されたアカウントIDのマイルストーンのみを返すこと' do
        expect(Milestone.by_account('user1')).to contain_exactly(user1_milestone1, user1_milestone2)
        expect(Milestone.by_account('user2')).to contain_exactly(user2_milestone)
      end

      it '存在しないアカウントIDの場合は空の結果を返すこと' do
        expect(Milestone.by_account('nonexistent')).to be_empty
      end
    end

    describe '.by_status' do
      it '指定されたステータスのマイルストーンのみを返すこと' do
        expect(test_milestones.by_status('planning')).to contain_exactly(user1_milestone1)
        expect(test_milestones.by_status('in_progress')).to contain_exactly(user1_milestone2)
        expect(test_milestones.by_status('completed')).to contain_exactly(user2_milestone)
      end
    end

    describe '.active' do
      it 'planningとin_progressのマイルストーンを返すこと' do
        expect(test_milestones.active).to contain_exactly(user1_milestone1, user1_milestone2)
      end
    end

    describe '.completed' do
      it 'completedステータスのマイルストーンのみを返すこと' do
        expect(test_milestones.completed).to contain_exactly(user2_milestone)
      end
    end

    describe '.for_user' do
      it '指定されたユーザーIDのマイルストーンのみを返すこと' do
        expect(Milestone.for_user('user1')).to contain_exactly(user1_milestone1, user1_milestone2)
        expect(Milestone.for_user('user2')).to contain_exactly(user2_milestone)
      end
    end
  end

  describe 'インスタンスメソッド' do
    let(:milestone) { create(:milestone) }

    it 'created_atが自動設定されること' do
      expect(milestone.created_at).to be_present
    end

    it 'updated_atが自動設定されること' do
      expect(milestone.updated_at).to be_present
    end

    describe '#planning?' do
      it 'planningステータスでtrueを返すこと' do
        milestone.update!(status: 'planning')
        expect(milestone.planning?).to be true
      end

      it 'planning以外のステータスでfalseを返すこと' do
        milestone.update!(status: 'in_progress')
        expect(milestone.planning?).to be false
      end
    end

    describe '#in_progress?' do
      it 'in_progressステータスでtrueを返すこと' do
        milestone.update!(status: 'in_progress')
        expect(milestone.in_progress?).to be true
      end

      it 'in_progress以外のステータスでfalseを返すこと' do
        milestone.update!(status: 'planning')
        expect(milestone.in_progress?).to be false
      end
    end

    describe '#completed?' do
      it 'completedステータスでtrueを返すこと' do
        milestone.update!(status: 'completed')
        expect(milestone.completed?).to be true
      end

      it 'completed以外のステータスでfalseを返すこと' do
        milestone.update!(status: 'planning')
        expect(milestone.completed?).to be false
      end
    end

    describe '#cancelled?' do
      it 'cancelledステータスでtrueを返すこと' do
        milestone.update!(status: 'cancelled')
        expect(milestone.cancelled?).to be true
      end

      it 'cancelled以外のステータスでfalseを返すこと' do
        milestone.update!(status: 'planning')
        expect(milestone.cancelled?).to be false
      end
    end

    describe '#total_tasks_count' do
      it '関連するタスクの総数を返すこと' do
        task1 = create(:task, account_id: milestone.account_id)
        task2 = create(:task, account_id: milestone.account_id)
        create(:milestone_task, milestone: milestone, task: task1)
        create(:milestone_task, milestone: milestone, task: task2)

        expect(milestone.total_tasks_count).to eq(2)
      end

      it 'タスクが関連付けられていない場合は0を返すこと' do
        expect(milestone.total_tasks_count).to eq(0)
      end
    end

    describe '#completed_tasks_count' do
      it '完了したタスクの数を返すこと' do
        completed_task = create(:task, account_id: milestone.account_id, status: 'completed')
        pending_task = create(:task, account_id: milestone.account_id, status: 'pending')
        create(:milestone_task, milestone: milestone, task: completed_task)
        create(:milestone_task, milestone: milestone, task: pending_task)

        expect(milestone.completed_tasks_count).to eq(1)
      end

      it '完了したタスクがない場合は0を返すこと' do
        expect(milestone.completed_tasks_count).to eq(0)
      end
    end

    describe '#progress_percentage' do
      it '進捗率を正しく計算すること' do
        completed_task = create(:task, account_id: milestone.account_id, status: 'completed')
        pending_task = create(:task, account_id: milestone.account_id, status: 'pending')
        create(:milestone_task, milestone: milestone, task: completed_task)
        create(:milestone_task, milestone: milestone, task: pending_task)

        expect(milestone.progress_percentage).to eq(50)
      end

      it 'タスクがない場合は0を返すこと' do
        expect(milestone.progress_percentage).to eq(0)
      end

      it '全てのタスクが完了している場合は100を返すこと' do
        completed_task1 = create(:task, account_id: milestone.account_id, status: 'completed')
        completed_task2 = create(:task, account_id: milestone.account_id, status: 'completed')
        create(:milestone_task, milestone: milestone, task: completed_task1)
        create(:milestone_task, milestone: milestone, task: completed_task2)

        expect(milestone.progress_percentage).to eq(100)
      end
    end
  end
end
