require 'rails_helper'
require_relative 'shared_context'

RSpec.describe 'GET /api/v1/categories', type: :request do
  include_context 'categories request spec setup'

  describe 'GET /api/v1/categories' do
    context '正常系' do
      before do
        create_list(:category, 3, account_id: user_id)
      end

      it 'returns a successful response' do
        get '/api/v1/categories', headers: auth_headers
        expect(response).to have_http_status(:ok)
      end

      it 'returns the expected JSON structure' do
        get '/api/v1/categories', headers: auth_headers
        json_response = JSON.parse(response.body)
        expect(json_response['data']).to be_an(Array)
        expect(json_response['data'].length).to eq(3)
      end

      it 'returns categories for the authenticated user only' do
        other_user_category = create(:category, account_id: 'other-user')
        get '/api/v1/categories', headers: auth_headers

        json_response = JSON.parse(response.body)
        category_ids = json_response['data'].map { |cat| cat['id'] }

        expect(category_ids).to include(*Category.where(account_id: user_id).pluck(:id))
        expect(category_ids).not_to include(other_user_category.id)
      end

      it 'returns correct category attributes' do
        category = create(:category, account_id: user_id, name: 'Test Category')
        get '/api/v1/categories', headers: auth_headers

        json_response = JSON.parse(response.body)
        returned_category = json_response['data'].find { |c| c['id'] == category.id }

        expect(returned_category).to include(
          'id' => category.id,
          'accountId' => category.account_id,
          'name' => category.name
        )
        expect(returned_category['createdAt']).to eq(category.created_at.iso8601)
        expect(returned_category['updatedAt']).to eq(category.updated_at.iso8601)
      end
    end

    context '異常系' do
      context '認証関連' do
        it '認証が失敗した場合、適切なエラーを返すこと' do
          # authorize メソッドを直接オーバーライドして認証エラーをシミュレート
          allow_any_instance_of(ApplicationController).to receive(:authorize) do |controller|
            controller.render json: { message: 'Invalid token' }, status: :unauthorized
          end

          get '/api/v1/categories', headers: auth_headers

          expect(response).to have_http_status(:unauthorized)
          expect(JSON.parse(response.body)['message']).to eq('Invalid token')
        end
      end

      context '権限関連' do
        it '権限が不足している場合、403エラーを返すこと' do
          # validate_permissions メソッドを直接オーバーライドして権限エラーをシミュレート
          allow_any_instance_of(ApplicationController).to receive(:validate_permissions) do |controller|
            controller.render json: { message: 'Permission denied' }, status: :forbidden
          end

          get '/api/v1/categories', headers: auth_headers

          expect(response).to have_http_status(:forbidden)
          expect(JSON.parse(response.body)['message']).to eq('Permission denied')
        end
      end

      context 'データベースエラー' do
        it 'データベースエラーが発生した場合、500エラーを返すこと' do
          allow(Category).to receive(:for_user).and_raise(ActiveRecord::StatementInvalid, 'Database error')

          get '/api/v1/categories', headers: auth_headers

          expect(response).to have_http_status(:internal_server_error)
        end
      end
    end

    context 'エッジケース' do
      it 'カテゴリが存在しない場合、空の配列を返すこと' do
        get '/api/v1/categories', headers: auth_headers

        json_response = JSON.parse(response.body)
        expect(json_response['data']).to eq([])
      end

      it '大量のカテゴリがある場合でも正常に動作すること' do
        # 認証を再設定（他のテストで認証が変更された可能性があるため）
        mock_request_authentication(user_id: user_id)

        create_list(:category, 100, account_id: user_id)

        get '/api/v1/categories', headers: auth_headers

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        expect(json_response['data'].length).to eq(100)
      end
    end
  end
end
