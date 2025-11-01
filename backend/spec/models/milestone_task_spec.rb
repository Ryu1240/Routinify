require 'rails_helper'

RSpec.describe MilestoneTask, type: :model do
  describe 'associations' do
    it 'belongs to milestone' do
      milestone_task = MilestoneTask.reflect_on_association(:milestone)
      expect(milestone_task.macro).to eq(:belongs_to)
    end

    it 'belongs to task' do
      milestone_task = MilestoneTask.reflect_on_association(:task)
      expect(milestone_task.macro).to eq(:belongs_to)
    end
  end

  describe 'バリデーション' do
    let(:milestone) { create(:milestone) }
    let(:task) { create(:task, account_id: milestone.account_id) }

    subject { build(:milestone_task, milestone: milestone, task: task) }

    it '有効なファクトリを持つこと' do
      expect(subject).to be_valid
    end

    context 'milestone_id' do
      it 'milestone_idが必須であること' do
        subject.milestone_id = nil
        expect(subject).to be_invalid
        expect(subject.errors[:milestone_id]).to be_present
      end
    end

    context 'task_id' do
      it 'task_idが必須であること' do
        subject.task_id = nil
        expect(subject).to be_invalid
        expect(subject.errors[:task_id]).to be_present
      end
    end

    context 'uniqueness' do
      it '同じmilestoneとtaskの組み合わせが重複しないこと' do
        create(:milestone_task, milestone: milestone, task: task)
        duplicate = build(:milestone_task, milestone: milestone, task: task)

        expect(duplicate).to be_invalid
        expect(duplicate.errors[:milestone_id]).to be_present
      end

      it '異なるmilestoneとtaskの組み合わせは許可されること' do
        create(:milestone_task, milestone: milestone, task: task)
        different_milestone = create(:milestone, account_id: milestone.account_id)
        different_task = create(:task, account_id: milestone.account_id)
        different_combination = build(:milestone_task, milestone: different_milestone, task: different_task)

        expect(different_combination).to be_valid
      end

      it '同じmilestoneに異なるtaskを関連付けできること' do
        task1 = create(:task, account_id: milestone.account_id)
        task2 = create(:task, account_id: milestone.account_id)
        create(:milestone_task, milestone: milestone, task: task1)
        new_milestone_task = build(:milestone_task, milestone: milestone, task: task2)

        expect(new_milestone_task).to be_valid
      end

      it '同じtaskを異なるmilestoneに関連付けできること' do
        milestone1 = create(:milestone, account_id: 'user1')
        milestone2 = create(:milestone, account_id: 'user1')
        task = create(:task, account_id: 'user1')
        create(:milestone_task, milestone: milestone1, task: task)
        new_milestone_task = build(:milestone_task, milestone: milestone2, task: task)

        expect(new_milestone_task).to be_valid
      end
    end
  end

  describe 'データの整合性' do
    let(:milestone) { create(:milestone) }
    let(:task) { create(:task, account_id: milestone.account_id) }

    it 'milestoneとtaskの関連付けが正しく動作すること' do
      milestone_task = create(:milestone_task, milestone: milestone, task: task)

      expect(milestone_task.milestone).to eq(milestone)
      expect(milestone_task.task).to eq(task)
      expect(milestone.tasks).to include(task)
      expect(task.milestones).to include(milestone)
    end
  end
end

