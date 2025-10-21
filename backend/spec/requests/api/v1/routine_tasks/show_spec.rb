require 'rails_helper'
require_relative 'shared_context'

RSpec.describe 'GET /api/v1/routine_tasks/:id', type: :request do
  include_context 'routine_tasks request spec setup'

  let(:category) { create(:category, account_id: user_id, name: '仕事') }
  let!(:routine_task) { create(:routine_task, account_id: user_id, title: 'Test Routine Task', frequency: 'daily', priority: 'high', category_id: category.id) }

  describe 'GET /api/v1/routine_tasks/:id' do
    context '正常系' do
      it 'returns a successful response with 200 status' do
        get "/api/v1/routine_tasks/#{routine_task.id}", headers: auth_headers
        expect(response).to have_http_status(:ok)
      end

      it 'returns the correct routine_task data' do
        get "/api/v1/routine_tasks/#{routine_task.id}", headers: auth_headers
        json_response = JSON.parse(response.body)

        expect(json_response['data']).to include(
          'id' => routine_task.id,
          'accountId' => routine_task.account_id,
          'title' => routine_task.title,
          'frequency' => routine_task.frequency,
          'intervalValue' => routine_task.interval_value,
          'maxActiveTasks' => routine_task.max_active_tasks,
          'categoryId' => routine_task.category_id,
          'priority' => routine_task.priority,
          'isActive' => routine_task.is_active
        )
        expect(json_response['data']['lastGeneratedAt']).to eq(routine_task.last_generated_at&.iso8601)
        expect(json_response['data']['nextGenerationAt']).to eq(routine_task.next_generation_at.iso8601)
        expect(json_response['data']['createdAt']).to eq(routine_task.created_at.iso8601)
        expect(json_response['data']['updatedAt']).to eq(routine_task.updated_at.iso8601)
      end

      it 'returns correct JSON structure' do
        get "/api/v1/routine_tasks/#{routine_task.id}", headers: auth_headers
        json_response = JSON.parse(response.body)

        expect(json_response).to have_key('data')
        expect(json_response['data']).to be_a(Hash)
        expect(json_response['data']).to have_key('id')
        expect(json_response['data']).to have_key('title')
      end

      it 'includes category information when routine_task has a category' do
        get "/api/v1/routine_tasks/#{routine_task.id}", headers: auth_headers
        json_response = JSON.parse(response.body)

        expect(json_response['data']['categoryId']).to eq(category.id)
        expect(json_response['data']['categoryName']).to eq('仕事')
      end
    end

    context '異常系' do
      context '習慣化タスクが存在しない場合' do
        it 'returns 404 when routine_task does not exist' do
          get '/api/v1/routine_tasks/99999', headers: auth_headers
          expect(response).to have_http_status(:not_found)

          json_response = JSON.parse(response.body)
          expect(json_response['errors']).to include('習慣化タスクが見つかりません')
        end
      end

      context '他のユーザーの習慣化タスクを取得しようとした場合' do
        let!(:other_user_routine_task) { create(:routine_task, account_id: 'other-user', title: 'Other User Routine Task') }

        it 'returns 404 when trying to access another users routine_task' do
          get "/api/v1/routine_tasks/#{other_user_routine_task.id}", headers: auth_headers
          expect(response).to have_http_status(:not_found)

          json_response = JSON.parse(response.body)
          expect(json_response['errors']).to include('習慣化タスクが見つかりません')
        end
      end

      context '認証関連' do
        it '認証が失敗した場合、適切なエラーを返すこと' do
          allow_any_instance_of(ApplicationController).to receive(:authorize) do |controller|
            controller.render json: { message: 'Invalid token' }, status: :unauthorized
          end

          get "/api/v1/routine_tasks/#{routine_task.id}", headers: auth_headers

          expect(response).to have_http_status(:unauthorized)
          expect(JSON.parse(response.body)['message']).to eq('Invalid token')
        end
      end

      context '権限関連' do
        it '権限が不足している場合、403エラーを返すこと' do
          allow_any_instance_of(ApplicationController).to receive(:validate_permissions) do |controller|
            controller.render json: { message: 'Permission denied' }, status: :forbidden
          end

          get "/api/v1/routine_tasks/#{routine_task.id}", headers: auth_headers

          expect(response).to have_http_status(:forbidden)
          expect(JSON.parse(response.body)['message']).to eq('Permission denied')
        end
      end
    end

    context 'エッジケース' do
      it 'last_generated_atがnilの場合でも正常に取得される' do
        routine_task_without_last_generated = create(:routine_task, account_id: user_id, title: 'No Last Generated Task', last_generated_at: nil)

        get "/api/v1/routine_tasks/#{routine_task_without_last_generated.id}", headers: auth_headers
        expect(response).to have_http_status(:ok)

        json_response = JSON.parse(response.body)
        expect(json_response['data']['lastGeneratedAt']).to be_nil
      end

      it '特殊文字を含むタイトルでも正常に取得される' do
        special_routine_task = create(:routine_task, account_id: user_id, title: '習慣タスク (重要) - 毎日実行が必要です！')

        get "/api/v1/routine_tasks/#{special_routine_task.id}", headers: auth_headers
        expect(response).to have_http_status(:ok)

        json_response = JSON.parse(response.body)
        expect(json_response['data']['title']).to eq('習慣タスク (重要) - 毎日実行が必要です！')
      end

      it 'priorityがnilの場合でも正常に取得される' do
        routine_task_without_priority = create(:routine_task, account_id: user_id, title: 'No Priority Task', priority: nil)

        get "/api/v1/routine_tasks/#{routine_task_without_priority.id}", headers: auth_headers
        expect(response).to have_http_status(:ok)

        json_response = JSON.parse(response.body)
        expect(json_response['data']['priority']).to be_nil
      end
    end
  end
end
