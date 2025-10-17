module Api
  module V1
    class CategoriesController < ApplicationController
      def index
        validate_permissions(['read:tasks']) do
          user_id = current_user_id
          categories = Category.for_user(user_id)
          render json: {
            data: categories.map { |category| format_category_response(category) }
          }, status: :ok
        end
      end

      private

      def format_category_response(category)
        {
          id: category.id,
          accountId: category.account_id,
          name: category.name,
          createdAt: category.created_at.iso8601(3),
          updatedAt: category.updated_at.iso8601(3)
        }
      end
    end
  end
end
