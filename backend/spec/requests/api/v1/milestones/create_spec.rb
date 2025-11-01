require 'rails_helper'
require_relative 'shared_context'

RSpec.describe 'POST /api/v1/milestones', type: :request do
  include_context 'milestones request spec setup'

  let(:valid_params) do
    {
      milestone: {
        name: 'New Milestone',
        description: 'This is a test milestone',
        start_date: Date.current + 1.week,
        due_date: Date.current + 2.weeks,
        status: 'planning'
      }
    }
  end

  describe 'POST /api/v1/milestones' do
    context '正常系' do
      it 'returns a successful response with 201 status' do
        post '/api/v1/milestones', params: valid_params, headers: auth_headers
        expect(response).to have_http_status(:created)
      end

      it 'creates a new milestone' do
        expect do
          post '/api/v1/milestones', params: valid_params, headers: auth_headers
        end.to change(Milestone, :count).by(1)
      end

      it 'returns success message' do
        post '/api/v1/milestones', params: valid_params, headers: auth_headers
        json_response = JSON.parse(response.body)

        expect(json_response).to include(
          'success' => true,
          'message' => 'マイルストーンが正常に作成されました'
        )
      end

      it 'automatically sets account_id to current user' do
        post '/api/v1/milestones', params: valid_params, headers: auth_headers
        created_milestone = Milestone.last
        expect(created_milestone.account_id).to eq(user_id)
      end

      it 'creates milestone with minimal required params (name only)' do
        minimal_params = { milestone: { name: 'Minimal Milestone' } }

        post '/api/v1/milestones', params: minimal_params, headers: auth_headers

        expect(response).to have_http_status(:created)
        created_milestone = Milestone.last
        expect(created_milestone.name).to eq('Minimal Milestone')
        expect(created_milestone.status).to eq('planning')
      end

      it 'sets default status to planning when not provided' do
        params_without_status = { milestone: { name: 'Milestone without status' } }

        post '/api/v1/milestones', params: params_without_status, headers: auth_headers

        created_milestone = Milestone.last
        expect(created_milestone.status).to eq('planning')
      end

      it 'returns the created milestone data' do
        post '/api/v1/milestones', params: valid_params, headers: auth_headers

        json_response = JSON.parse(response.body)
        expect(json_response['data']).to include(
          'name' => 'New Milestone',
          'description' => 'This is a test milestone',
          'status' => 'planning',
          'accountId' => user_id
        )
        expect(json_response['data']).to have_key('id')
        expect(json_response['data']).to have_key('createdAt')
        expect(json_response['data']).to have_key('updatedAt')
      end
    end

    context '異常系' do
      context 'バリデーションエラー' do
        it 'returns 422 when name is missing' do
          invalid_params = { milestone: { description: 'No name milestone' } }

          post '/api/v1/milestones', params: invalid_params, headers: auth_headers
          expect(response).to have_http_status(:unprocessable_entity)

          json_response = JSON.parse(response.body)
          expect(json_response['success']).to be false
          expect(json_response['errors']).to include('Name は必須です')
        end

        it 'returns 422 when name is too long' do
          long_name_params = { milestone: { name: 'a' * 256 } }

          post '/api/v1/milestones', params: long_name_params, headers: auth_headers
          expect(response).to have_http_status(:unprocessable_entity)

          json_response = JSON.parse(response.body)
          expect(json_response['success']).to be false
          expect(json_response['errors']).to include('Name は255文字以内で入力してください')
        end

        it 'returns 422 when status is invalid' do
          invalid_status_params = { milestone: { name: 'Test Milestone', status: 'invalid_status' } }

          post '/api/v1/milestones', params: invalid_status_params, headers: auth_headers
          expect(response).to have_http_status(:unprocessable_entity)

          json_response = JSON.parse(response.body)
          expect(json_response['success']).to be false
          expect(json_response['errors']).to be_present
        end
      end

      context '認証関連' do
        it '認証が失敗した場合、適切なエラーを返すこと' do
          allow_any_instance_of(ApplicationController).to receive(:authorize) do |controller|
            controller.render json: { message: 'Invalid token' }, status: :unauthorized
          end

          post '/api/v1/milestones', params: valid_params, headers: auth_headers

          expect(response).to have_http_status(:unauthorized)
          expect(JSON.parse(response.body)['message']).to eq('Invalid token')
        end
      end

      context '権限関連' do
        it '権限が不足している場合、403エラーを返すこと' do
          allow_any_instance_of(ApplicationController).to receive(:validate_permissions) do |controller|
            controller.render json: { message: 'Permission denied' }, status: :forbidden
          end

          post '/api/v1/milestones', params: valid_params, headers: auth_headers

          expect(response).to have_http_status(:forbidden)
          expect(JSON.parse(response.body)['message']).to eq('Permission denied')
        end
      end
    end
  end
end
