module AccountScoped
  extend ActiveSupport::Concern

  included do
    scope :by_account, ->(account_id) { where(account_id: account_id) }
  end

  class_methods do
    def for_user(user_id)
      by_account(user_id)
    end
  end
end
