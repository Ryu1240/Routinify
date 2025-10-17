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
        expect(subject.errors[:title]).to include("can't be blank")
      end

      it 'titleが空文字列の場合、無効であること' do
        subject.title = ''
        expect(subject).to be_invalid
        expect(subject.errors[:title]).to include("can't be blank")
      end

      it 'titleが255文字以内であること' do
        subject.title = 'a' * 256
        expect(subject).to be_invalid
        expect(subject.errors[:title]).to include('is too long (maximum is 255 characters)')
      end
    end

    context 'account_id' do
      it 'account_idが必須であること' do
        subject.account_id = nil
        expect(subject).to be_invalid
        expect(subject.errors[:account_id]).to include("can't be blank")
      end

      it 'account_idが空文字列の場合、無効であること' do
        subject.account_id = ''
        expect(subject).to be_invalid
        expect(subject.errors[:account_id]).to include("can't be blank")
      end
    end

    context 'due_date' do
      it 'due_dateは任意であること' do
        subject.due_date = nil
        expect(subject).to be_valid
      end

      it '有効な日付形式を受け入れること' do
        subject.due_date = Date.current
        expect(subject).to be_valid
      end
    end

    context 'status' do
      it 'statusは任意であること' do
        subject.status = nil
        expect(subject).to be_valid
      end

      it 'statusが50文字以内であること' do
        subject.status = 'a' * 51
        expect(subject).to be_invalid
        expect(subject.errors[:status]).to include('is too long (maximum is 50 characters)')
      end
    end

    context 'priority' do
      it 'priorityは任意であること' do
        subject.priority = nil
        expect(subject).to be_valid
      end

      it 'priorityが50文字以内であること' do
        subject.priority = 'a' * 51
        expect(subject).to be_invalid
        expect(subject.errors[:priority]).to include('is too long (maximum is 50 characters)')
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
  end
end
