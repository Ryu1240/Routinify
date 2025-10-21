require 'rails_helper'
require_relative 'shared_context'

RSpec.describe 'GET /api/v1/routine_tasks', type: :request do
  include_context 'routine_tasks request spec setup'

  describe 'GET /api/v1/routine_tasks' do
    context '正常系' do
      before do
        create_list(:routine_task, 3, account_id: user_id)
      end

      it 'returns a successful response' do
        get '/api/v1/routine_tasks', headers: auth_headers
        expect(response).to have_http_status(:ok)
      end

      it 'returns the expected JSON structure' do
        get '/api/v1/routine_tasks', headers: auth_headers
        json_response = JSON.parse(response.body)
        expect(json_response['data']).to be_an(Array)
        expect(json_response['data'].length).to eq(3)
      end

      it 'returns routine_tasks for the authenticated user only' do
        other_user_routine_task = create(:routine_task, account_id: 'other-user')
        get '/api/v1/routine_tasks', headers: auth_headers

        json_response = JSON.parse(response.body)
        routine_task_ids = json_response['data'].map { |task| task['id'] }

        expect(routine_task_ids).to include(*RoutineTask.where(account_id: user_id).pluck(:id))
        expect(routine_task_ids).not_to include(other_user_routine_task.id)
      end

      it 'returns correct routine_task attributes' do
        routine_task = create(:routine_task, account_id: user_id, title: 'Test Routine Task')
        get '/api/v1/routine_tasks', headers: auth_headers

        json_response = JSON.parse(response.body)
        returned_task = json_response['data'].find { |t| t['id'] == routine_task.id }

        expect(returned_task).to include(
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
        expect(returned_task['lastGeneratedAt']).to eq(routine_task.last_generated_at&.iso8601)
        expect(returned_task['nextGenerationAt']).to eq(routine_task.next_generation_at.iso8601)
        expect(returned_task['createdAt']).to eq(routine_task.created_at.iso8601)
        expect(returned_task['updatedAt']).to eq(routine_task.updated_at.iso8601)
      end

      it 'includes category information when routine_task has a category' do
        category = create(:category, account_id: user_id, name: 'Test Category')
        routine_task = create(:routine_task, account_id: user_id, category: category)
        get '/api/v1/routine_tasks', headers: auth_headers

        json_response = JSON.parse(response.body)
        returned_task = json_response['data'].find { |t| t['id'] == routine_task.id }

        expect(returned_task['categoryId']).to eq(category.id)
        expect(returned_task['categoryName']).to eq('Test Category')
      end
    end

    context '異常系' do
      context '認証関連' do
        it '認証が失敗した場合、適切なエラーを返すこと' do
          # authorize メソッドを直接オーバーライドして認証エラーをシミュレート
          allow_any_instance_of(ApplicationController).to receive(:authorize) do |controller|
            controller.render json: { message: 'Invalid token' }, status: :unauthorized
          end

          get '/api/v1/routine_tasks', headers: auth_headers

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

          get '/api/v1/routine_tasks', headers: auth_headers

          expect(response).to have_http_status(:forbidden)
          expect(JSON.parse(response.body)['message']).to eq('Permission denied')
        end
      end

      context 'データベースエラー' do
        it 'データベースエラーが発生した場合、500エラーを返すこと' do
          allow(RoutineTask).to receive(:for_user).and_raise(ActiveRecord::StatementInvalid, 'Database error')

          get '/api/v1/routine_tasks', headers: auth_headers

          expect(response).to have_http_status(:internal_server_error)
        end
      end
    end

    context 'エッジケース' do
      it '習慣タスクが存在しない場合、空の配列を返すこと' do
        get '/api/v1/routine_tasks', headers: auth_headers

        json_response = JSON.parse(response.body)
        expect(json_response['data']).to eq([])
      end

      it '大量の習慣タスクがある場合でも正常に動作すること' do
        create_list(:routine_task, 100, account_id: user_id)

        get '/api/v1/routine_tasks', headers: auth_headers

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        expect(json_response['data'].length).to eq(100)
      end
    end
  end
end
