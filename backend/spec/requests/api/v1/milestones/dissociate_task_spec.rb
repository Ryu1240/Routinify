require 'rails_helper'
require_relative 'shared_context'

RSpec.describe 'DELETE /api/v1/milestones/:id/tasks', type: :request do
  include_context 'milestones request spec setup'

  let(:milestone) { create(:milestone, account_id: user_id) }
  let(:task) { create(:task, account_id: user_id) }
  let(:task2) { create(:task, account_id: user_id) }
  let(:task3) { create(:task, account_id: user_id) }
  let(:valid_params) do
    {
      task: {
        task_ids: [task.id]
      }
    }
  end
  let(:multiple_valid_params) do
    {
      task: {
        task_ids: [task.id, task2.id, task3.id]
      }
    }
  end

  before do
    milestone.tasks << [task, task2, task3]
  end

  describe 'DELETE /api/v1/milestones/:id/tasks' do
    context '正常系' do
      it 'returns a successful response with 200 status' do
        delete "/api/v1/milestones/#{milestone.id}/tasks", params: valid_params, headers: auth_headers
        expect(response).to have_http_status(:ok)
      end

      it 'dissociates a task from a milestone' do
        expect do
          delete "/api/v1/milestones/#{milestone.id}/tasks", params: valid_params, headers: auth_headers
        end.to change(milestone.tasks, :count).by(-1)
      end

      it 'dissociates multiple tasks from a milestone' do
        expect do
          delete "/api/v1/milestones/#{milestone.id}/tasks", params: multiple_valid_params, headers: auth_headers
        end.to change(milestone.tasks, :count).by(-3)
      end

      it 'returns success message for single task' do
        delete "/api/v1/milestones/#{milestone.id}/tasks", params: valid_params, headers: auth_headers
        json_response = JSON.parse(response.body)

        expect(json_response).to include(
          'success' => true
        )
        expect(json_response['message']).to match(/件のタスクの関連付けを解除しました/)
      end

      it 'returns success message for multiple tasks' do
        delete "/api/v1/milestones/#{milestone.id}/tasks", params: multiple_valid_params, headers: auth_headers
        json_response = JSON.parse(response.body)

        expect(json_response).to include(
          'success' => true,
          'message' => '3件のタスクの関連付けを解除しました'
        )
      end

      it 'returns updated milestone data' do
        delete "/api/v1/milestones/#{milestone.id}/tasks", params: valid_params, headers: auth_headers
        json_response = JSON.parse(response.body)

        expect(json_response['data']).to be_present
        expect(json_response['data']['id']).to eq(milestone.id)
        expect(json_response['data']['tasks'].any? { |t| t['id'] == task.id }).to be false
      end

      it 'handles task_ids in root params' do
        root_params = { task_ids: [task.id] }
        delete "/api/v1/milestones/#{milestone.id}/tasks", params: root_params, headers: auth_headers
        expect(response).to have_http_status(:ok)
      end
    end

    context '異常系' do
      context 'マイルストーンが見つからない場合' do
        it 'returns 404 when milestone does not exist' do
          invalid_id = 99999
          delete "/api/v1/milestones/#{invalid_id}/tasks", params: valid_params, headers: auth_headers
          expect(response).to have_http_status(:not_found)

          json_response = JSON.parse(response.body)
          expect(json_response['success']).to be false
          expect(json_response['errors']).to include('マイルストーンが見つかりません')
        end
      end

      context 'タスクが見つからない場合' do
        it 'returns 404 when task does not exist' do
          invalid_params = { task: { task_ids: [99999] } }
          delete "/api/v1/milestones/#{milestone.id}/tasks", params: invalid_params, headers: auth_headers
          expect(response).to have_http_status(:not_found)

          json_response = JSON.parse(response.body)
          expect(json_response['success']).to be false
          expect(json_response['errors']).to include('一部のタスクが見つかりません')
        end
      end

      context '他のユーザーのタスクの場合' do
        it 'returns 404 when task belongs to another user' do
          other_user_task = create(:task, account_id: 'other-user-id')
          invalid_params = { task: { task_ids: [other_user_task.id] } }

          delete "/api/v1/milestones/#{milestone.id}/tasks", params: invalid_params, headers: auth_headers
          expect(response).to have_http_status(:not_found)

          json_response = JSON.parse(response.body)
          expect(json_response['success']).to be false
          expect(json_response['errors']).to include('一部のタスクが見つかりません')
        end
      end

      context 'タスクが関連付けられていない場合' do
        it 'returns 422 when all tasks are not associated' do
          unassociated_task = create(:task, account_id: user_id)
          invalid_params = { task: { task_ids: [unassociated_task.id] } }

          delete "/api/v1/milestones/#{milestone.id}/tasks", params: invalid_params, headers: auth_headers
          expect(response).to have_http_status(:unprocessable_entity)

          json_response = JSON.parse(response.body)
          expect(json_response['success']).to be false
          expect(json_response['errors']).to include('すべてのタスクはマイルストーンに関連付けられていません')
        end
      end

      context 'パラメータエラー' do
        it 'returns 422 when task_ids is missing' do
          invalid_params = { task: {} }
          delete "/api/v1/milestones/#{milestone.id}/tasks", params: invalid_params, headers: auth_headers
          expect(response).to have_http_status(:unprocessable_entity)

          json_response = JSON.parse(response.body)
          expect(json_response['success']).to be false
          expect(json_response['errors']).to include('task_idsは必須です')
        end

        it 'returns 422 when task_ids is empty array' do
          invalid_params = { task: { task_ids: [] } }
          delete "/api/v1/milestones/#{milestone.id}/tasks", params: invalid_params, headers: auth_headers
          expect(response).to have_http_status(:unprocessable_entity)

          json_response = JSON.parse(response.body)
          expect(json_response['success']).to be false
          expect(json_response['errors']).to include('task_idsは必須です')
        end
      end

      context '認証関連' do
        it '認証が失敗した場合、適切なエラーを返すこと' do
          allow_any_instance_of(ApplicationController).to receive(:authorize) do |controller|
            controller.render json: { message: 'Invalid token' }, status: :unauthorized
          end

          delete "/api/v1/milestones/#{milestone.id}/tasks", params: valid_params, headers: auth_headers
          expect(response).to have_http_status(:unauthorized)
        end
      end

      context '権限関連' do
        it '権限が不足している場合、403エラーを返すこと' do
          allow_any_instance_of(ApplicationController).to receive(:validate_permissions) do |controller|
            controller.render json: { message: 'Permission denied' }, status: :forbidden
          end

          delete "/api/v1/milestones/#{milestone.id}/tasks", params: valid_params, headers: auth_headers
          expect(response).to have_http_status(:forbidden)
        end
      end
    end
  end
end

