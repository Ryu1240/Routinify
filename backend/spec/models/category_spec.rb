require 'rails_helper'

RSpec.describe Category, type: :model do
  describe 'associations' do
    it 'has many tasks' do
      category = Category.reflect_on_association(:tasks)
      expect(category.macro).to eq(:has_many)
    end
  end

  describe 'validations' do
    subject { Category.new(name: 'Test Category', account_id: 'test_user') }

    it 'validates presence of name' do
      category = Category.new(account_id: 'test_user')
      expect(category).not_to be_valid
      expect(category.errors[:name]).to include("can't be blank")
    end

    it 'validates presence of account_id' do
      category = Category.new(name: 'Test Category')
      expect(category).not_to be_valid
      expect(category.errors[:account_id]).to include("can't be blank")
    end

    it 'validates length of name' do
      category = Category.new(name: 'a' * 256, account_id: 'test_user')
      expect(category).not_to be_valid
      expect(category.errors[:name]).to include('is too long (maximum is 255 characters)')
    end

    it 'validates uniqueness of name scoped to account_id' do
      existing_category = Category.create!(name: 'Test Category', account_id: 'user1')
      duplicate_category = Category.new(name: 'Test Category', account_id: 'user1')

      expect(duplicate_category).not_to be_valid
      expect(duplicate_category.errors[:name]).to include('同じカテゴリ名が既に存在します')
    end

    it 'allows same name for different accounts' do
      Category.create!(name: 'Test Category', account_id: 'user1')
      different_account_category = Category.new(name: 'Test Category', account_id: 'user2')

      expect(different_account_category).to be_valid
    end
  end

  describe '.by_account' do
    let!(:user1_category) { Category.create!(name: 'User1 Category', account_id: 'user1') }
    let!(:user2_category) { Category.create!(name: 'User2 Category', account_id: 'user2') }

    it 'returns categories for specified account' do
      categories = Category.by_account('user1')

      expect(categories).to include(user1_category)
      expect(categories).not_to include(user2_category)
    end
  end

  describe '.for_user' do
    let!(:user1_category) { Category.create!(name: 'User1 Category', account_id: 'user1') }
    let!(:user2_category) { Category.create!(name: 'User2 Category', account_id: 'user2') }

    it 'returns categories for specified user' do
      categories = Category.for_user('user1')

      expect(categories).to include(user1_category)
      expect(categories).not_to include(user2_category)
    end
  end
end
