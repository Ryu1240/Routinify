class Task < ApplicationRecord
  validates :title, presence: true, length: { maximum: 255 }
  validates :accountId, presence: true
  validates :status, length: { maximum: 50 }, allow_nil: true
  validates :priority, length: { maximum: 50 }, allow_nil: true
  validates :category, length: { maximum: 50 }, allow_nil: true
  
  scope :by_account, ->(account_id) { where(accountId: account_id) }
 
  def self.for_user(user_id)
    by_account(user_id)
  end
end