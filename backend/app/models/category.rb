class Category < ApplicationRecord

  has_many :tasks, dependent: :nullify

  validates :name, presence: true, length: { maximum: 255 }
  validates :account_id, presence: true
  validates :name, uniqueness: { scope: :account_id, message: '同じカテゴリ名が既に存在します' }

  scope :by_account, ->(account_id) { where(account_id: account_id) }

  # ユーザーIDに紐づくカテゴリを取得
  # 将来的にアーカイブ機能やソート機能を追加する際の拡張ポイント
  def self.for_user(user_id)
    by_account(user_id)
  end

end
