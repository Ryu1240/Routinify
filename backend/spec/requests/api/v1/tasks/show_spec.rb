require 'rails_helper'
require_relative 'shared_context'

RSpec.describe 'GET /api/v1/tasks/:id', type: :request do
  include_context 'tasks request spec setup'

  let(:category) { create(:category, account_id: user_id, name: '仕事') }
  let!(:task) { create(:task, account_id: user_id, title: 'Test Task', status: 'in_progress', priority: 'high', category_id: category.id) }

  describe 'GET /api/v1/tasks/:id' do
    context '正常系' do
      it 'returns a successful response with 200 status' do
        get "/api/v1/tasks/#{task.id}", headers: auth_headers
        expect(response).to have_http_status(:ok)
      end

      it 'returns the correct task data' do
        get "/api/v1/tasks/#{task.id}", headers: auth_headers
        json_response = JSON.parse(response.body)

        expect(json_response['data']).to include(
          'id' => task.id,
          'accountId' => task.account_id,
          'title' => task.title,
          'status' => task.status,
          'priority' => task.priority,
          'categoryId' => task.category_id
        )
        expect(json_response['data']['dueDate']).to eq(task.due_date&.iso8601)
        expect(json_response['data']['createdAt']).to eq(task.created_at.iso8601)
        expect(json_response['data']['updatedAt']).to eq(task.updated_at.iso8601)
      end

      it 'returns correct JSON structure' do
        get "/api/v1/tasks/#{task.id}", headers: auth_headers
        json_response = JSON.parse(response.body)

        expect(json_response).to have_key('data')
        expect(json_response['data']).to be_a(Hash)
        expect(json_response['data']).to have_key('id')
        expect(json_response['data']).to have_key('title')
      end
    end

    context '異常系' do
      context 'タスクが存在しない場合' do
        it 'returns 404 when task does not exist' do
          get '/api/v1/tasks/99999', headers: auth_headers
          expect(response).to have_http_status(:not_found)

          json_response = JSON.parse(response.body)
          expect(json_response['errors']).to include('タスクが見つかりません')
        end
      end

      context '他のユーザーのタスクを取得しようとした場合' do
        let!(:other_user_task) { create(:task, account_id: 'other-user', title: 'Other User Task') }

        it 'returns 404 when trying to access another users task' do
          get "/api/v1/tasks/#{other_user_task.id}", headers: auth_headers
          expect(response).to have_http_status(:not_found)

          json_response = JSON.parse(response.body)
          expect(json_response['errors']).to include('タスクが見つかりません')
        end
      end

      context '認証関連' do
        it '認証が失敗した場合、適切なエラーを返すこと' do
          allow_any_instance_of(ApplicationController).to receive(:authorize) do |controller|
            controller.render json: { message: 'Invalid token' }, status: :unauthorized
          end

          get "/api/v1/tasks/#{task.id}", headers: auth_headers

          expect(response).to have_http_status(:unauthorized)
          expect(JSON.parse(response.body)['message']).to eq('Invalid token')
        end
      end

      context '権限関連' do
        it '権限が不足している場合、403エラーを返すこと' do
          allow_any_instance_of(ApplicationController).to receive(:validate_permissions) do |controller|
            controller.render json: { message: 'Permission denied' }, status: :forbidden
          end

          get "/api/v1/tasks/#{task.id}", headers: auth_headers

          expect(response).to have_http_status(:forbidden)
          expect(JSON.parse(response.body)['message']).to eq('Permission denied')
        end
      end
    end

    context 'エッジケース' do
      it 'due_dateがnilの場合でも正常に取得される' do
        task_without_due_date = create(:task, account_id: user_id, title: 'No Due Date Task', due_date: nil)

        get "/api/v1/tasks/#{task_without_due_date.id}", headers: auth_headers
        expect(response).to have_http_status(:ok)

        json_response = JSON.parse(response.body)
        expect(json_response['data']['dueDate']).to be_nil
      end

      it '特殊文字を含むタイトルでも正常に取得される' do
        special_task = create(:task, account_id: user_id, title: 'タスク (重要) - 緊急対応が必要です！')

        get "/api/v1/tasks/#{special_task.id}", headers: auth_headers
        expect(response).to have_http_status(:ok)

        json_response = JSON.parse(response.body)
        expect(json_response['data']['title']).to eq('タスク (重要) - 緊急対応が必要です！')
      end

      it 'statusがnilの場合でも正常に取得される' do
        task_without_status = create(:task, account_id: user_id, title: 'No Status Task', status: nil)

        get "/api/v1/tasks/#{task_without_status.id}", headers: auth_headers
        expect(response).to have_http_status(:ok)

        json_response = JSON.parse(response.body)
        expect(json_response['data']['status']).to be_nil
      end
    end
  end
end
