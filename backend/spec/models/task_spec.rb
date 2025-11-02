require 'rails_helper'

RSpec.describe Task, type: :model do
  describe 'associations' do
    it 'belongs to category' do
      task = Task.reflect_on_association(:category)
      expect(task.macro).to eq(:belongs_to)
    end

    it 'category is optional' do
      task = Task.new(title: 'Test Task', account_id: 'test_user', category_id: nil)
      expect(task).to be_valid
    end

    it 'can be associated with a category' do
      category = Category.create!(name: 'Test Category', account_id: 'test_user')
      task = Task.new(title: 'Test Task', account_id: 'test_user', category_id: category.id)
      expect(task).to be_valid
      expect(task.category).to eq(category)
    end

    it 'has many milestone_tasks' do
      task = Task.reflect_on_association(:milestone_tasks)
      expect(task.macro).to eq(:has_many)
    end

    it 'has many milestones through milestone_tasks' do
      task = Task.reflect_on_association(:milestones)
      expect(task.macro).to eq(:has_many)
      expect(task.options[:through]).to eq(:milestone_tasks)
    end

    it 'can be associated with milestones' do
      milestone = Milestone.create!(name: 'Test Milestone', account_id: 'test_user')
      task = Task.create!(title: 'Test Task', account_id: 'test_user')
      MilestoneTask.create!(milestone: milestone, task: task)

      expect(task.milestones).to include(milestone)
      expect(milestone.tasks).to include(task)
    end
  end

  describe 'バリデーション' do
    subject { build(:task) }

    it '有効なファクトリを持つこと' do
      expect(subject).to be_valid
    end

    context 'title' do
      it 'titleが必須であること' do
        subject.title = nil
        expect(subject).to be_invalid
        expect(subject.errors[:title]).to include('タイトルは必須です')
      end

      it 'titleが空文字列の場合、無効であること' do
        subject.title = ''
        expect(subject).to be_invalid
        expect(subject.errors[:title]).to include('タイトルは必須です')
      end

      it 'titleが255文字以内であること' do
        subject.title = 'a' * 256
        expect(subject).to be_invalid
        expect(subject.errors[:title]).to include('タイトルは255文字以内で入力してください')
      end
    end

    context 'account_id' do
      it 'account_idが必須であること' do
        subject.account_id = nil
        expect(subject).to be_invalid
        expect(subject.errors[:account_id]).to include('アカウントIDは必須です')
      end

      it 'account_idが空文字列の場合、無効であること' do
        subject.account_id = ''
        expect(subject).to be_invalid
        expect(subject.errors[:account_id]).to include('アカウントIDは必須です')
      end
    end

    context 'due_date' do
      it 'due_dateは任意であること' do
        subject.due_date = nil
        expect(subject).to be_valid
      end

      it '有効な日付形式を受け入れること' do
        subject.due_date = 1.week.from_now
        expect(subject).to be_valid
      end
    end

    context 'status' do
      it 'statusは任意であること' do
        subject.status = nil
        expect(subject).to be_valid
      end

      it '有効なstatus値を受け入れること' do
        %w[pending in_progress completed on_hold].each do |status|
          subject.status = status
          expect(subject).to be_valid
        end
      end

      it '無効なstatus値でエラーになること' do
        subject.status = '無効なステータス'
        expect(subject).to be_invalid
        expect(subject.errors[:status]).to include('は一覧にありません')
      end
    end

    context 'priority' do
      it 'priorityは任意であること' do
        subject.priority = nil
        expect(subject).to be_valid
      end

      it '有効なpriority値を受け入れること' do
        %w[low medium high].each do |priority|
          subject.priority = priority
          expect(subject).to be_valid
        end
      end

      it '無効なpriority値でエラーになること' do
        subject.priority = '無効な優先度'
        expect(subject).to be_invalid
        expect(subject.errors[:priority]).to include('は一覧にありません')
      end
    end

    context 'due_date' do
      it '未来の日付を受け入れること' do
        subject.due_date = 1.day.from_now
        expect(subject).to be_valid
      end

      it '過去の日付も受け入れること' do
        subject.due_date = 1.day.ago
        expect(subject).to be_valid
      end

      it '現在の日付も受け入れること' do
        subject.due_date = Time.current
        expect(subject).to be_valid
      end
    end
  end

  describe 'スコープ' do
    let!(:user1_task1) { create(:task, account_id: 'user1') }
    let!(:user1_task2) { create(:task, account_id: 'user1') }
    let!(:user2_task) { create(:task, account_id: 'user2') }

    describe '.by_account' do
      it '指定されたアカウントIDのタスクのみを返すこと' do
        expect(Task.by_account('user1')).to contain_exactly(user1_task1, user1_task2)
        expect(Task.by_account('user2')).to contain_exactly(user2_task)
      end

      it '存在しないアカウントIDの場合は空の結果を返すこと' do
        expect(Task.by_account('nonexistent')).to be_empty
      end
    end

    describe '.for_user' do
      it '指定されたユーザーIDのタスクのみを返すこと' do
        expect(Task.for_user('user1')).to contain_exactly(user1_task1, user1_task2)
        expect(Task.for_user('user2')).to contain_exactly(user2_task)
      end

      it '存在しないユーザーIDの場合は空の結果を返すこと' do
        expect(Task.for_user('nonexistent')).to be_empty
      end
    end
  end

  describe 'インスタンスメソッド' do
    let(:task) { create(:task) }

    it 'created_atが自動設定されること' do
      expect(task.created_at).to be_present
    end

    it 'updated_atが自動設定されること' do
      expect(task.updated_at).to be_present
    end

    describe '#overdue?' do
      it '期限切れのタスクでtrueを返すこと' do
        task.update_column(:due_date, 1.day.ago)
        expect(task.overdue?).to be true
      end

      it '期限前のタスクでfalseを返すこと' do
        task.update!(due_date: 1.day.from_now)
        expect(task.overdue?).to be false
      end

      it '期限がないタスクでfalseを返すこと' do
        task.update!(due_date: nil)
        expect(task.overdue?).to be false
      end
    end

    describe '#completed?' do
      it '完了ステータスでtrueを返すこと' do
        task.update!(status: 'completed')
        expect(task.completed?).to be true
      end

      it '未完了ステータスでfalseを返すこと' do
        task.update!(status: 'pending')
        expect(task.completed?).to be false
      end
    end

    describe '#in_progress?' do
      it '進行中ステータスでtrueを返すこと' do
        task.update!(status: 'in_progress')
        expect(task.in_progress?).to be true
      end

      it '進行中以外のステータスでfalseを返すこと' do
        task.update!(status: 'pending')
        expect(task.in_progress?).to be false
      end
    end

    describe '#pending?' do
      it '未着手ステータスでtrueを返すこと' do
        task.update!(status: 'pending')
        expect(task.pending?).to be true
      end

      it '未着手以外のステータスでfalseを返すこと' do
        task.update!(status: 'completed')
        expect(task.pending?).to be false
      end
    end
  end

  describe 'クラスメソッド' do
    describe '.search' do
      let!(:task1) { create(:task, title: 'テストタスク1') }
      let!(:task2) { create(:task, title: 'サンプルタスク2') }
      let!(:task3) { create(:task, title: 'テスト用タスク3') }

      it 'タイトルで検索できること' do
        results = Task.search('テスト')
        expect(results).to contain_exactly(task1, task3)
      end

      it '部分一致で検索できること' do
        results = Task.search('サンプル')
        expect(results).to contain_exactly(task2)
      end

      it '大文字小文字を区別しないこと' do
        results = Task.search('テスト')
        expect(results).to contain_exactly(task1, task3)
      end

      it '該当するタスクがない場合は空の結果を返すこと' do
        results = Task.search('存在しない')
        expect(results).to be_empty
      end
    end
  end

  describe 'ソフトデリート' do
    let(:task) { create(:task) }
    let(:routine_task) { create(:routine_task) }
    let(:routine_task_related_task) { create(:task, routine_task: routine_task, account_id: routine_task.account_id) }

    describe 'デフォルトスコープ' do
      it '削除されていないタスクのみを返すこと' do
        task1 = create(:task)
        task2 = create(:task)
        task2.update_column(:deleted_at, Time.current)

        expect(Task.all).to contain_exactly(task1)
      end
    end

    describe '.with_deleted' do
      it '削除されたタスクも含めて取得できること' do
        task1 = create(:task)
        task2 = create(:task)
        task2.update_column(:deleted_at, Time.current)

        expect(Task.with_deleted.count).to eq(2)
      end
    end

    describe '.only_deleted' do
      it '削除されたタスクのみを取得できること' do
        task1 = create(:task)
        task2 = create(:task)
        task2.update_column(:deleted_at, Time.current)

        expect(Task.only_deleted).to contain_exactly(task2)
      end
    end

    describe '#soft_delete' do
      it 'deleted_atを設定すること' do
        expect { task.soft_delete }.to change { task.reload.deleted_at }.from(nil).to(be_present)
      end

      it '削除されたタスクはデフォルトスコープで取得できないこと' do
        task.soft_delete
        expect(Task.find_by(id: task.id)).to be_nil
      end

      it 'with_deletedスコープで取得できること' do
        task.soft_delete
        expect(Task.with_deleted.find_by(id: task.id)).to be_present
      end
    end

    describe '#hard_delete' do
      it 'タスクを物理削除すること' do
        task_id = task.id
        task.hard_delete
        expect(Task.with_deleted.find_by(id: task_id)).to be_nil
      end
    end

    describe '#delete_task' do
      context '習慣化タスクに紐づくタスクの場合' do
        it '論理削除すること' do
          expect { routine_task_related_task.delete_task }.to change { routine_task_related_task.reload.deleted_at }.from(nil).to(be_present)
        end

        it 'タスクはデータベースに残ること' do
          task_id = routine_task_related_task.id
          routine_task_related_task.delete_task
          expect(Task.with_deleted.find_by(id: task_id)).to be_present
        end
      end

      context '習慣化タスクに紐づかないタスクの場合' do
        it '物理削除すること' do
          task_id = task.id
          task.delete_task
          expect(Task.with_deleted.find_by(id: task_id)).to be_nil
        end
      end
    end

    describe '#deleted?' do
      it '削除されていないタスクでfalseを返すこと' do
        expect(task.deleted?).to be false
      end

      it '削除されたタスクでtrueを返すこと' do
        task.update_column(:deleted_at, Time.current)
        expect(task.deleted?).to be true
      end
    end

    describe '#routine_task_related?' do
      it '習慣化タスクに紐づくタスクでtrueを返すこと' do
        expect(routine_task_related_task.routine_task_related?).to be true
      end

      it '習慣化タスクに紐づかないタスクでfalseを返すこと' do
        expect(task.routine_task_related?).to be false
      end
    end
  end
end
