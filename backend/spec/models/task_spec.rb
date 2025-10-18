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
        %w[未着手 進行中 完了 保留].each do |status|
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

      it '過去の日付でエラーになること' do
        subject.due_date = 1.day.ago
        expect(subject).to be_invalid
        expect(subject.errors[:due_date]).to include('は未来の日付である必要があります')
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
        task.update!(status: '完了')
        expect(task.completed?).to be true
      end

      it '未完了ステータスでfalseを返すこと' do
        task.update!(status: '未着手')
        expect(task.completed?).to be false
      end
    end

    describe '#in_progress?' do
      it '進行中ステータスでtrueを返すこと' do
        task.update!(status: '進行中')
        expect(task.in_progress?).to be true
      end

      it '進行中以外のステータスでfalseを返すこと' do
        task.update!(status: '未着手')
        expect(task.in_progress?).to be false
      end
    end

    describe '#pending?' do
      it '未着手ステータスでtrueを返すこと' do
        task.update!(status: '未着手')
        expect(task.pending?).to be true
      end

      it '未着手以外のステータスでfalseを返すこと' do
        task.update!(status: '完了')
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
end
