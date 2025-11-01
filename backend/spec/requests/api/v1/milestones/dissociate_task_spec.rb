require 'rails_helper'
require_relative 'shared_context'

RSpec.describe 'DELETE /api/v1/milestones/:id/tasks/:task_id', type: :request do
  include_context 'milestones request spec setup'

  let(:milestone) { create(:milestone, account_id: user_id) }
  let(:task) { create(:task, account_id: user_id) }

  before do
    milestone.tasks << task
  end

  describe 'DELETE /api/v1/milestones/:id/tasks/:task_id' do
    context '正常系' do
      it 'returns a successful response with 200 status' do
        delete "/api/v1/milestones/#{milestone.id}/tasks/#{task.id}", headers: auth_headers
        expect(response).to have_http_status(:ok)
      end

      it 'dissociates a task from a milestone' do
        expect do
          delete "/api/v1/milestones/#{milestone.id}/tasks/#{task.id}", headers: auth_headers
        end.to change(milestone.tasks, :count).by(-1)
      end

      it 'returns success message' do
        delete "/api/v1/milestones/#{milestone.id}/tasks/#{task.id}", headers: auth_headers
        json_response = JSON.parse(response.body)

        expect(json_response).to include(
          'success' => true,
          'message' => 'タスクの関連付けを解除しました'
        )
      end

      it 'returns updated milestone data' do
        delete "/api/v1/milestones/#{milestone.id}/tasks/#{task.id}", headers: auth_headers
        json_response = JSON.parse(response.body)

        expect(json_response['data']).to be_present
        expect(json_response['data']['id']).to eq(milestone.id)
        expect(json_response['data']['tasks'].any? { |t| t['id'] == task.id }).to be false
      end
    end

    context '異常系' do
      context 'マイルストーンが見つからない場合' do
        it 'returns 404 when milestone does not exist' do
          invalid_id = 99999
          delete "/api/v1/milestones/#{invalid_id}/tasks/#{task.id}", headers: auth_headers
          expect(response).to have_http_status(:not_found)

          json_response = JSON.parse(response.body)
          expect(json_response['success']).to be false
          expect(json_response['errors']).to include('マイルストーンが見つかりません')
        end
      end

      context 'タスクが見つからない場合' do
        it 'returns 404 when task does not exist' do
          invalid_task_id = 99999
          delete "/api/v1/milestones/#{milestone.id}/tasks/#{invalid_task_id}", headers: auth_headers
          expect(response).to have_http_status(:not_found)

          json_response = JSON.parse(response.body)
          expect(json_response['success']).to be false
          expect(json_response['errors']).to include('タスクが見つかりません')
        end
      end

      context '他のユーザーのタスクの場合' do
        it 'returns 404 when task belongs to another user' do
          other_user_task = create(:task, account_id: 'other-user-id')
          delete "/api/v1/milestones/#{milestone.id}/tasks/#{other_user_task.id}", headers: auth_headers
          expect(response).to have_http_status(:not_found)

          json_response = JSON.parse(response.body)
          expect(json_response['success']).to be false
          expect(json_response['errors']).to include('タスクが見つかりません')
        end
      end

      context 'タスクが関連付けられていない場合' do
        it 'returns 422 when task is not associated' do
          unassociated_task = create(:task, account_id: user_id)

          delete "/api/v1/milestones/#{milestone.id}/tasks/#{unassociated_task.id}", headers: auth_headers
          expect(response).to have_http_status(:unprocessable_entity)

          json_response = JSON.parse(response.body)
          expect(json_response['success']).to be false
          expect(json_response['errors']).to include('このタスクはマイルストーンに関連付けられていません')
        end
      end

      context '認証関連' do
        it '認証が失敗した場合、適切なエラーを返すこと' do
          allow_any_instance_of(ApplicationController).to receive(:authorize) do |controller|
            controller.render json: { message: 'Invalid token' }, status: :unauthorized
          end

          delete "/api/v1/milestones/#{milestone.id}/tasks/#{task.id}", headers: auth_headers
          expect(response).to have_http_status(:unauthorized)
        end
      end

      context '権限関連' do
        it '権限が不足している場合、403エラーを返すこと' do
          allow_any_instance_of(ApplicationController).to receive(:validate_permissions) do |controller|
            controller.render json: { message: 'Permission denied' }, status: :forbidden
          end

          delete "/api/v1/milestones/#{milestone.id}/tasks/#{task.id}", headers: auth_headers
          expect(response).to have_http_status(:forbidden)
        end
      end
    end
  end
end

