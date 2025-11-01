require 'rails_helper'
require_relative 'shared_context'

RSpec.describe 'POST /api/v1/milestones/:id/tasks', type: :request do
  include_context 'milestones request spec setup'

  let(:milestone) { create(:milestone, account_id: user_id) }
  let(:task) { create(:task, account_id: user_id) }
  let(:valid_params) do
    {
      task: {
        task_id: task.id
      }
    }
  end

  describe 'POST /api/v1/milestones/:id/tasks' do
    context '正常系' do
      it 'returns a successful response with 200 status' do
        post "/api/v1/milestones/#{milestone.id}/tasks", params: valid_params, headers: auth_headers
        expect(response).to have_http_status(:ok)
      end

      it 'associates a task to a milestone' do
        expect do
          post "/api/v1/milestones/#{milestone.id}/tasks", params: valid_params, headers: auth_headers
        end.to change(milestone.tasks, :count).by(1)
      end

      it 'returns success message' do
        post "/api/v1/milestones/#{milestone.id}/tasks", params: valid_params, headers: auth_headers
        json_response = JSON.parse(response.body)

        expect(json_response).to include(
          'success' => true,
          'message' => 'タスクをマイルストーンに関連付けました'
        )
      end

      it 'returns updated milestone data' do
        post "/api/v1/milestones/#{milestone.id}/tasks", params: valid_params, headers: auth_headers
        json_response = JSON.parse(response.body)

        expect(json_response['data']).to be_present
        expect(json_response['data']['id']).to eq(milestone.id)
        expect(json_response['data']['tasks']).to be_present
        expect(json_response['data']['tasks'].any? { |t| t['id'] == task.id }).to be true
      end

      it 'handles task_id in root params' do
        root_params = { task_id: task.id }
        post "/api/v1/milestones/#{milestone.id}/tasks", params: root_params, headers: auth_headers
        expect(response).to have_http_status(:ok)
      end
    end

    context '異常系' do
      context 'マイルストーンが見つからない場合' do
        it 'returns 404 when milestone does not exist' do
          invalid_id = 99999
          post "/api/v1/milestones/#{invalid_id}/tasks", params: valid_params, headers: auth_headers
          expect(response).to have_http_status(:not_found)

          json_response = JSON.parse(response.body)
          expect(json_response['success']).to be false
          expect(json_response['errors']).to include('マイルストーンが見つかりません')
        end
      end

      context 'タスクが見つからない場合' do
        it 'returns 404 when task does not exist' do
          invalid_params = { task: { task_id: 99999 } }
          post "/api/v1/milestones/#{milestone.id}/tasks", params: invalid_params, headers: auth_headers
          expect(response).to have_http_status(:not_found)

          json_response = JSON.parse(response.body)
          expect(json_response['success']).to be false
          expect(json_response['errors']).to include('タスクが見つかりません')
        end
      end

      context '他のユーザーのタスクの場合' do
        it 'returns 404 when task belongs to another user' do
          other_user_task = create(:task, account_id: 'other-user-id')
          invalid_params = { task: { task_id: other_user_task.id } }

          post "/api/v1/milestones/#{milestone.id}/tasks", params: invalid_params, headers: auth_headers
          expect(response).to have_http_status(:not_found)

          json_response = JSON.parse(response.body)
          expect(json_response['success']).to be false
          expect(json_response['errors']).to include('タスクが見つかりません')
        end
      end

      context '重複チェック' do
        it 'returns 422 when task is already associated' do
          milestone.tasks << task

          post "/api/v1/milestones/#{milestone.id}/tasks", params: valid_params, headers: auth_headers
          expect(response).to have_http_status(:unprocessable_entity)

          json_response = JSON.parse(response.body)
          expect(json_response['success']).to be false
          expect(json_response['errors']).to include('このタスクは既にマイルストーンに関連付けられています')
        end
      end

      context 'パラメータエラー' do
        it 'returns 422 when task_id is missing' do
          invalid_params = { task: {} }
          post "/api/v1/milestones/#{milestone.id}/tasks", params: invalid_params, headers: auth_headers
          expect(response).to have_http_status(:unprocessable_entity)

          json_response = JSON.parse(response.body)
          expect(json_response['success']).to be false
          expect(json_response['errors']).to include('task_idは必須です')
        end
      end

      context '認証関連' do
        it '認証が失敗した場合、適切なエラーを返すこと' do
          allow_any_instance_of(ApplicationController).to receive(:authorize) do |controller|
            controller.render json: { message: 'Invalid token' }, status: :unauthorized
          end

          post "/api/v1/milestones/#{milestone.id}/tasks", params: valid_params, headers: auth_headers
          expect(response).to have_http_status(:unauthorized)
        end
      end

      context '権限関連' do
        it '権限が不足している場合、403エラーを返すこと' do
          allow_any_instance_of(ApplicationController).to receive(:validate_permissions) do |controller|
            controller.render json: { message: 'Permission denied' }, status: :forbidden
          end

          post "/api/v1/milestones/#{milestone.id}/tasks", params: valid_params, headers: auth_headers
          expect(response).to have_http_status(:forbidden)
        end
      end
    end
  end
end

