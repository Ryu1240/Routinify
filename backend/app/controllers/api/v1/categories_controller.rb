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

      def create
        validate_permissions(['write:tasks']) do
          user_id = current_user_id
          category = Category.new(category_params.merge(account_id: user_id))

          if category.save
            render json: { message: 'カテゴリが正常に作成されました' }, status: :created
          else
            render json: { errors: category.errors.full_messages }, status: :unprocessable_entity
          end
        end
      end

      private

      def category_params
        params.require(:category).permit(:name)
      end

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
