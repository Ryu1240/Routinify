module Api
  module V1
    class CategoriesController < BaseController
      def index
        validate_permissions([ 'read:tasks' ]) do
          user_id = current_user_id
          categories = Category.for_user(user_id)
          render_success(data: categories.map { |category| CategorySerializer.new(category).as_json })
        end
      end

      def create
        validate_permissions([ 'write:tasks' ]) do
          user_id = current_user_id
          category = Category.new(category_params.merge(account_id: user_id))

          if category.save
            render_success(
              data: CategorySerializer.new(category).as_json,
              message: 'カテゴリが正常に作成されました',
              status: :created
            )
          else
            render_error(errors: category.errors.full_messages)
          end
        end
      end

      def update
        validate_permissions([ 'write:tasks' ]) do
          user_id = current_user_id
          category = Category.find_by(id: params[:id], account_id: user_id)

          if category.nil?
            render_not_found('カテゴリ')
            return
          end

          if category.update(category_params)
            render_success(
              data: CategorySerializer.new(category).as_json,
              message: 'カテゴリが正常に更新されました'
            )
          else
            render_error(errors: category.errors.full_messages)
          end
        end
      end

      def destroy
        validate_permissions([ 'delete:tasks' ]) do
          user_id = current_user_id
          category = Category.find_by(id: params[:id], account_id: user_id)

          if category.nil?
            render_not_found('カテゴリ')
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
    end
  end
end
