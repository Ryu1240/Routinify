module Api

  module V1

    class CategoriesController < ApplicationController

      def index
        validate_permissions(['read:tasks']) do
          user_id = current_user_id
          categories = Category.for_user(user_id)
          render json: {
            data: categories.map { |category| format_category_response(category) },
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

      def update
        validate_permissions(['write:tasks']) do
          user_id = current_user_id
          category = Category.find_by(id: params[:id], account_id: user_id)

          if category.nil?
            render json: { errors: ['カテゴリが見つかりません'] }, status: :not_found
            return
          end

          if category.update(category_params)
            render json: { message: 'カテゴリが正常に更新されました' }, status: :ok
          else
            render json: { errors: category.errors.full_messages }, status: :unprocessable_entity
          end
        end
      end

      def destroy
        validate_permissions(['delete:tasks']) do
          user_id = current_user_id
          category = Category.find_by(id: params[:id], account_id: user_id)

          if category.nil?
            render json: { errors: ['カテゴリが見つかりません'] }, status: :not_found
            return
          end

          category.destroy
          head :no_content
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
          updatedAt: category.updated_at.iso8601(3),
        }
      end

    end

  end

end
