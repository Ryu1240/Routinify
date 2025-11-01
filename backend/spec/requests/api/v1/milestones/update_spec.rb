require 'rails_helper'
require_relative 'shared_context'

RSpec.describe 'PUT /api/v1/milestones/:id', type: :request do
  include_context 'milestones request spec setup'

  let(:milestone) do
    create(:milestone,
           account_id: user_id,
           name: 'Original Milestone',
           description: 'Original description',
           start_date: Date.current + 1.week,
           due_date: Date.current + 2.weeks,
           status: 'planning',
           completed_at: nil)
  end

  let(:valid_update_params) do
    {
      milestone: {
        name: 'Updated Milestone',
        description: 'Updated description',
        start_date: Date.current + 2.weeks,
        due_date: Date.current + 3.weeks,
        status: 'in_progress'
      }
    }
  end

  describe 'PUT /api/v1/milestones/:id' do
    context '正常系' do
      it 'returns a successful response with 200 status' do
        put "/api/v1/milestones/#{milestone.id}", params: valid_update_params, headers: auth_headers
        expect(response).to have_http_status(:ok)
      end

      it 'updates the milestone' do
        put "/api/v1/milestones/#{milestone.id}", params: valid_update_params, headers: auth_headers

        milestone.reload
        expect(milestone.name).to eq('Updated Milestone')
        expect(milestone.description).to eq('Updated description')
        expect(milestone.status).to eq('in_progress')
      end

      it 'returns success message' do
        put "/api/v1/milestones/#{milestone.id}", params: valid_update_params, headers: auth_headers
        json_response = JSON.parse(response.body)

        expect(json_response).to include(
          'success' => true,
          'message' => 'マイルストーンが正常に更新されました'
        )
      end

      it 'returns the updated milestone data' do
        put "/api/v1/milestones/#{milestone.id}", params: valid_update_params, headers: auth_headers

        json_response = JSON.parse(response.body)
        expect(json_response['data']).to include(
          'name' => 'Updated Milestone',
          'description' => 'Updated description',
          'status' => 'in_progress',
          'accountId' => user_id
        )
        expect(json_response['data']).to have_key('id')
        expect(json_response['data']).to have_key('updatedAt')
      end

      it 'sets completed_at when status changes to completed' do
        update_to_completed = {
          milestone: {
            status: 'completed'
          }
        }

        put "/api/v1/milestones/#{milestone.id}", params: update_to_completed, headers: auth_headers

        expect(response).to have_http_status(:ok)
        milestone.reload
        expect(milestone.status).to eq('completed')
        expect(milestone.completed_at).to be_present
      end

      it 'clears completed_at when status changes from completed to other status' do
        # まずcompletedに変更
        milestone.update!(status: 'completed', completed_at: Time.current)

        # その後、planningに変更
        update_to_planning = {
          milestone: {
            status: 'planning'
          }
        }

        put "/api/v1/milestones/#{milestone.id}", params: update_to_planning, headers: auth_headers

        expect(response).to have_http_status(:ok)
        milestone.reload
        expect(milestone.status).to eq('planning')
        expect(milestone.completed_at).to be_nil
      end

      it 'allows partial updates (only name)' do
        partial_update = {
          milestone: {
            name: 'Partially Updated Milestone'
          }
        }

        put "/api/v1/milestones/#{milestone.id}", params: partial_update, headers: auth_headers

        expect(response).to have_http_status(:ok)
        milestone.reload
        expect(milestone.name).to eq('Partially Updated Milestone')
        expect(milestone.description).to eq('Original description') # 変更されていない
      end
    end

    context '異常系' do
      context 'マイルストーンが見つからない場合' do
        it 'returns 404 when milestone does not exist' do
          put '/api/v1/milestones/99999', params: valid_update_params, headers: auth_headers

          expect(response).to have_http_status(:not_found)
          json_response = JSON.parse(response.body)
          expect(json_response['success']).to be false
          expect(json_response['errors']).to include('マイルストーンが見つかりません')
        end
      end

      context '他のユーザーのマイルストーンの場合' do
        let(:other_user_milestone) do
          create(:milestone,
                 account_id: 'other-user-id',
                 name: 'Other User Milestone')
        end

        it 'returns 404 when trying to update another user\'s milestone' do
          put "/api/v1/milestones/#{other_user_milestone.id}", params: valid_update_params, headers: auth_headers

          expect(response).to have_http_status(:not_found)
          json_response = JSON.parse(response.body)
          expect(json_response['success']).to be false
          expect(json_response['errors']).to include('マイルストーンが見つかりません')
        end
      end

      context 'バリデーションエラー' do
        it 'returns 422 when name is missing' do
          invalid_params = {
            milestone: {
              name: ''
            }
          }

          put "/api/v1/milestones/#{milestone.id}", params: invalid_params, headers: auth_headers
          expect(response).to have_http_status(:unprocessable_entity)

          json_response = JSON.parse(response.body)
          expect(json_response['success']).to be false
          expect(json_response['errors']).to include('Name は必須です')
        end

        it 'returns 422 when name is too long' do
          long_name_params = {
            milestone: {
              name: 'a' * 256
            }
          }

          put "/api/v1/milestones/#{milestone.id}", params: long_name_params, headers: auth_headers
          expect(response).to have_http_status(:unprocessable_entity)

          json_response = JSON.parse(response.body)
          expect(json_response['success']).to be false
          expect(json_response['errors']).to include('Name は255文字以内で入力してください')
        end

        it 'returns 422 when status is invalid' do
          invalid_status_params = {
            milestone: {
              status: 'invalid_status'
            }
          }

          put "/api/v1/milestones/#{milestone.id}", params: invalid_status_params, headers: auth_headers
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

          put "/api/v1/milestones/#{milestone.id}", params: valid_update_params, headers: auth_headers

          expect(response).to have_http_status(:unauthorized)
          expect(JSON.parse(response.body)['message']).to eq('Invalid token')
        end
      end

      context '権限関連' do
        it '権限が不足している場合、403エラーを返すこと' do
          allow_any_instance_of(ApplicationController).to receive(:validate_permissions) do |controller|
            controller.render json: { message: 'Permission denied' }, status: :forbidden
          end

          put "/api/v1/milestones/#{milestone.id}", params: valid_update_params, headers: auth_headers

          expect(response).to have_http_status(:forbidden)
          expect(JSON.parse(response.body)['message']).to eq('Permission denied')
        end
      end
    end
  end
end

