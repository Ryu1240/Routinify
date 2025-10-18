require 'rails_helper'
require_relative 'shared_context'

RSpec.describe 'PUT /api/v1/categories/:id', type: :request do
  include_context 'categories request spec setup'

  let!(:category) { create(:category, account_id: user_id, name: 'Original Category') }
  let(:valid_update_params) do
    {
      category: {
        name: 'Updated Category'
      }
    }
  end

  describe 'PUT /api/v1/categories/:id' do
    context '正常系' do
      it 'returns a successful response with 200 status' do
        put "/api/v1/categories/#{category.id}", params: valid_update_params, headers: auth_headers
        expect(response).to have_http_status(:ok)
      end

      it 'updates the category name' do
        put "/api/v1/categories/#{category.id}", params: valid_update_params, headers: auth_headers

        category.reload
        expect(category.name).to eq('Updated Category')
      end

      it 'returns success message' do
        put "/api/v1/categories/#{category.id}", params: valid_update_params, headers: auth_headers
        json_response = JSON.parse(response.body)

        expect(json_response).to include(
          'message' => 'カテゴリが正常に更新されました'
        )
      end
    end

    context '異常系' do
      context 'カテゴリが存在しない場合' do
        it 'returns 404 when category does not exist' do
          put '/api/v1/categories/99999', params: valid_update_params, headers: auth_headers
          expect(response).to have_http_status(:not_found)

          json_response = JSON.parse(response.body)
          expect(json_response['errors']).to include('カテゴリが見つかりません')
        end
      end

      context '他のユーザーのカテゴリを更新しようとした場合' do
        let!(:other_user_category) { create(:category, account_id: 'other-user', name: 'Other User Category') }

        it 'returns 404 when trying to update another users category' do
          put "/api/v1/categories/#{other_user_category.id}", params: valid_update_params, headers: auth_headers
          expect(response).to have_http_status(:not_found)

          json_response = JSON.parse(response.body)
          expect(json_response['errors']).to include('カテゴリが見つかりません')
        end

        it 'does not update the other users category' do
          original_name = other_user_category.name
          put "/api/v1/categories/#{other_user_category.id}", params: valid_update_params, headers: auth_headers

          other_user_category.reload
          expect(other_user_category.name).to eq(original_name)
        end
      end

      context 'バリデーションエラー' do
        it 'returns 422 when name is empty string' do
          invalid_params = { category: { name: '' } }

          put "/api/v1/categories/#{category.id}", params: invalid_params, headers: auth_headers
          expect(response).to have_http_status(:unprocessable_entity)

          json_response = JSON.parse(response.body)
          expect(json_response['errors']).to include('Name は必須です')
        end

        it 'returns 422 when name is too long' do
          long_name_params = { category: { name: 'a' * 256 } }

          put "/api/v1/categories/#{category.id}", params: long_name_params, headers: auth_headers
          expect(response).to have_http_status(:unprocessable_entity)

          json_response = JSON.parse(response.body)
          expect(json_response['errors']).to include('Name は255文字以内で入力してください')
        end

        it 'returns 422 when name already exists for the same user' do
          create(:category, account_id: user_id, name: 'Duplicate Category')
          duplicate_params = { category: { name: 'Duplicate Category' } }

          put "/api/v1/categories/#{category.id}", params: duplicate_params, headers: auth_headers
          expect(response).to have_http_status(:unprocessable_entity)

          json_response = JSON.parse(response.body)
          expect(json_response['errors']).to include('Name 同じカテゴリ名が既に存在します')
        end

        it 'does not update category when validation fails' do
          original_name = category.name
          invalid_params = { category: { name: '' } }

          put "/api/v1/categories/#{category.id}", params: invalid_params, headers: auth_headers

          category.reload
          expect(category.name).to eq(original_name)
        end
      end

      context '認証関連' do
        it '認証が失敗した場合、適切なエラーを返すこと' do
          allow_any_instance_of(ApplicationController).to receive(:authorize) do |controller|
            controller.render json: { message: 'Invalid token' }, status: :unauthorized
          end

          put "/api/v1/categories/#{category.id}", params: valid_update_params, headers: auth_headers

          expect(response).to have_http_status(:unauthorized)
          expect(JSON.parse(response.body)['message']).to eq('Invalid token')
        end
      end

      context '権限関連' do
        it '権限が不足している場合、403エラーを返すこと' do
          allow_any_instance_of(ApplicationController).to receive(:validate_permissions) do |controller|
            controller.render json: { message: 'Permission denied' }, status: :forbidden
          end

          put "/api/v1/categories/#{category.id}", params: valid_update_params, headers: auth_headers

          expect(response).to have_http_status(:forbidden)
          expect(JSON.parse(response.body)['message']).to eq('Permission denied')
        end
      end
    end

    context 'エッジケース' do
      it '最大長のnameで正常に更新される' do
        max_name_params = { category: { name: 'a' * 255 } }

        put "/api/v1/categories/#{category.id}", params: max_name_params, headers: auth_headers
        expect(response).to have_http_status(:ok)

        category.reload
        expect(category.name).to eq('a' * 255)
      end

      it '特殊文字を含むnameで正常に更新される' do
        special_params = { category: { name: 'Updated カテゴリ (重要) - 緊急！' } }

        put "/api/v1/categories/#{category.id}", params: special_params, headers: auth_headers
        expect(response).to have_http_status(:ok)

        category.reload
        expect(category.name).to eq('Updated カテゴリ (重要) - 緊急！')
      end

      it '同じ名前でも異なるユーザーなら更新できる' do
        create(:category, account_id: 'other-user', name: 'Same Name')
        same_name_params = { category: { name: 'Same Name' } }

        put "/api/v1/categories/#{category.id}", params: same_name_params, headers: auth_headers
        expect(response).to have_http_status(:ok)

        category.reload
        expect(category.name).to eq('Same Name')
      end
    end
  end
end
