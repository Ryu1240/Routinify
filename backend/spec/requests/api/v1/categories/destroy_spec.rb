require 'rails_helper'
require_relative 'shared_context'

RSpec.describe 'DELETE /api/v1/categories/:id', type: :request do
  include_context 'categories request spec setup'

  let!(:category) { create(:category, account_id: user_id, name: 'Category to Delete') }

  describe 'DELETE /api/v1/categories/:id' do
    context '正常系' do
      it 'returns a successful response with 204 status' do
        delete "/api/v1/categories/#{category.id}", headers: auth_headers
        expect(response).to have_http_status(:no_content)
      end

      it 'returns no body' do
        delete "/api/v1/categories/#{category.id}", headers: auth_headers
        expect(response.body).to be_empty
      end

      it 'deletes the category from database' do
        expect do
          delete "/api/v1/categories/#{category.id}", headers: auth_headers
        end.to change(Category, :count).by(-1)
      end

      it 'category can no longer be found' do
        delete "/api/v1/categories/#{category.id}", headers: auth_headers
        expect(Category.find_by(id: category.id)).to be_nil
      end
    end

    context '異常系' do
      context 'カテゴリが存在しない場合' do
        it 'returns 404 when category does not exist' do
          delete '/api/v1/categories/99999', headers: auth_headers
          expect(response).to have_http_status(:not_found)

          json_response = JSON.parse(response.body)
          expect(json_response['errors']).to include('カテゴリが見つかりません')
        end

        it 'does not delete any categories' do
          expect do
            delete '/api/v1/categories/99999', headers: auth_headers
          end.not_to change(Category, :count)
        end
      end

      context '他のユーザーのカテゴリを削除しようとした場合' do
        let!(:other_user_category) { create(:category, account_id: 'other-user', name: 'Other User Category') }

        it 'returns 404 when trying to delete another users category' do
          delete "/api/v1/categories/#{other_user_category.id}", headers: auth_headers
          expect(response).to have_http_status(:not_found)

          json_response = JSON.parse(response.body)
          expect(json_response['errors']).to include('カテゴリが見つかりません')
        end

        it 'does not delete the other users category' do
          expect do
            delete "/api/v1/categories/#{other_user_category.id}", headers: auth_headers
          end.not_to change(Category, :count)

          # カテゴリがまだ存在することを確認
          expect(Category.find_by(id: other_user_category.id)).not_to be_nil
        end
      end

      context '認証関連' do
        it '認証が失敗した場合、適切なエラーを返すこと' do
          allow_any_instance_of(ApplicationController).to receive(:authorize) do |controller|
            controller.render json: { message: 'Invalid token' }, status: :unauthorized
          end

          delete "/api/v1/categories/#{category.id}", headers: auth_headers

          expect(response).to have_http_status(:unauthorized)
          expect(JSON.parse(response.body)['message']).to eq('Invalid token')
        end

        it '認証が失敗した場合、カテゴリを削除しないこと' do
          allow_any_instance_of(ApplicationController).to receive(:authorize) do |controller|
            controller.render json: { message: 'Invalid token' }, status: :unauthorized
          end

          expect do
            delete "/api/v1/categories/#{category.id}", headers: auth_headers
          end.not_to change(Category, :count)
        end
      end

      context '権限関連' do
        it '権限が不足している場合、403エラーを返すこと' do
          allow_any_instance_of(ApplicationController).to receive(:validate_permissions) do |controller|
            controller.render json: { message: 'Permission denied' }, status: :forbidden
          end

          delete "/api/v1/categories/#{category.id}", headers: auth_headers

          expect(response).to have_http_status(:forbidden)
          expect(JSON.parse(response.body)['message']).to eq('Permission denied')
        end

        it '権限が不足している場合、カテゴリを削除しないこと' do
          allow_any_instance_of(ApplicationController).to receive(:validate_permissions) do |controller|
            controller.render json: { message: 'Permission denied' }, status: :forbidden
          end

          expect do
            delete "/api/v1/categories/#{category.id}", headers: auth_headers
          end.not_to change(Category, :count)
        end
      end
    end

    context 'エッジケース' do
      it '複数回削除を試みても、2回目は404を返す' do
        # 1回目の削除
        delete "/api/v1/categories/#{category.id}", headers: auth_headers
        expect(response).to have_http_status(:no_content)

        # 2回目の削除
        delete "/api/v1/categories/#{category.id}", headers: auth_headers
        expect(response).to have_http_status(:not_found)
      end

      it '異なるユーザーのカテゴリが混在している場合、自分のカテゴリのみ削除できる' do
        other_user_category = create(:category, account_id: 'other-user', name: 'Other Category')

        expect do
          delete "/api/v1/categories/#{category.id}", headers: auth_headers
        end.to change(Category, :count).by(-1)

        # 他ユーザーのカテゴリは残っている
        expect(Category.find_by(id: other_user_category.id)).not_to be_nil
      end

      it 'カテゴリを削除しても、関連タスクは残る（category_idがnullになる）' do
        task = create(:task, account_id: user_id, category_id: category.id)

        delete "/api/v1/categories/#{category.id}", headers: auth_headers
        expect(response).to have_http_status(:no_content)

        task.reload
        expect(task.category_id).to be_nil
        expect(Task.find_by(id: task.id)).not_to be_nil
      end
    end
  end
end
