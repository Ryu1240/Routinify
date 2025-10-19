require 'rails_helper'
require_relative 'shared_context'

RSpec.describe 'POST /api/v1/categories', type: :request do
  include_context 'categories request spec setup'

  let(:valid_params) do
    {
      category: {
        name: 'New Category'
      }
    }
  end

  describe 'POST /api/v1/categories' do
    context '正常系' do
      it 'returns a successful response with 201 status' do
        post '/api/v1/categories', params: valid_params, headers: auth_headers
        expect(response).to have_http_status(:created)
      end

      it 'creates a new category' do
        expect do
          post '/api/v1/categories', params: valid_params, headers: auth_headers
        end.to change(Category, :count).by(1)
      end

      it 'returns success message' do
        post '/api/v1/categories', params: valid_params, headers: auth_headers
        json_response = JSON.parse(response.body)

        expect(json_response).to include(
          'message' => 'カテゴリが正常に作成されました'
        )
      end

      it 'automatically sets account_id to current user' do
        post '/api/v1/categories', params: valid_params, headers: auth_headers
        created_category = Category.last
        expect(created_category.account_id).to eq(user_id)
      end
    end

    context '異常系' do
      context 'バリデーションエラー' do
        it 'returns 422 when name is empty string' do
          invalid_params = { category: { name: '' } }

          post '/api/v1/categories', params: invalid_params, headers: auth_headers
          expect(response).to have_http_status(:unprocessable_entity)

          json_response = JSON.parse(response.body)
          expect(json_response['errors']).to include('Name は必須です')
        end

        it 'returns 422 when name is too long' do
          long_name_params = { category: { name: 'a' * 256 } }

          post '/api/v1/categories', params: long_name_params, headers: auth_headers
          expect(response).to have_http_status(:unprocessable_entity)

          json_response = JSON.parse(response.body)
          expect(json_response['errors']).to include('Name は255文字以内で入力してください')
        end

        it 'returns 422 when name already exists for the same user' do
          create(:category, account_id: user_id, name: 'Duplicate Category')
          duplicate_params = { category: { name: 'Duplicate Category' } }

          post '/api/v1/categories', params: duplicate_params, headers: auth_headers
          expect(response).to have_http_status(:unprocessable_entity)

          json_response = JSON.parse(response.body)
          expect(json_response['errors']).to include('Name 同じカテゴリ名が既に存在します')
        end
      end

      context '認証関連' do
        it '認証が失敗した場合、適切なエラーを返すこと' do
          allow_any_instance_of(ApplicationController).to receive(:authorize) do |controller|
            controller.render json: { message: 'Invalid token' }, status: :unauthorized
          end

          post '/api/v1/categories', params: valid_params, headers: auth_headers

          expect(response).to have_http_status(:unauthorized)
          expect(JSON.parse(response.body)['message']).to eq('Invalid token')
        end
      end

      context '権限関連' do
        it '権限が不足している場合、403エラーを返すこと' do
          allow_any_instance_of(ApplicationController).to receive(:validate_permissions) do |controller|
            controller.render json: { message: 'Permission denied' }, status: :forbidden
          end

          post '/api/v1/categories', params: valid_params, headers: auth_headers

          expect(response).to have_http_status(:forbidden)
          expect(JSON.parse(response.body)['message']).to eq('Permission denied')
        end
      end
    end

    context 'エッジケース' do
      it '最大長のnameで正常に作成される' do
        max_name_params = { category: { name: 'a' * 255 } }

        post '/api/v1/categories', params: max_name_params, headers: auth_headers
        expect(response).to have_http_status(:created)

        json_response = JSON.parse(response.body)
        expect(json_response['message']).to eq('カテゴリが正常に作成されました')

        created_category = Category.last
        expect(created_category.name).to eq('a' * 255)
      end

      it '特殊文字を含むnameで正常に作成される' do
        special_params = { category: { name: 'カテゴリ (重要) - 緊急！' } }

        post '/api/v1/categories', params: special_params, headers: auth_headers
        expect(response).to have_http_status(:created)

        json_response = JSON.parse(response.body)
        expect(json_response['message']).to eq('カテゴリが正常に作成されました')

        created_category = Category.last
        expect(created_category.name).to eq('カテゴリ (重要) - 緊急！')
      end

      it '同じ名前でも異なるユーザーなら作成できる' do
        create(:category, account_id: 'other-user', name: 'Same Name')
        same_name_params = { category: { name: 'Same Name' } }

        post '/api/v1/categories', params: same_name_params, headers: auth_headers
        expect(response).to have_http_status(:created)

        json_response = JSON.parse(response.body)
        expect(json_response['message']).to eq('カテゴリが正常に作成されました')
      end
    end
  end
end
