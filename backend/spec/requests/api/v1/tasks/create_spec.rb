require 'rails_helper'
require_relative 'shared_context'

RSpec.describe 'POST /api/v1/tasks', type: :request do
  include_context 'tasks request spec setup'

  let(:category) { create(:category, account_id: user_id) }
  let(:valid_params) do
    {
      task: {
        title: 'New Task',
        due_date: Date.current + 1.week,
        status: 'pending',
        priority: 'high',
        category_id: category.id,
      },
    }
  end

  describe 'POST /api/v1/tasks' do
    context '正常系' do
      it 'returns a successful response with 201 status' do
        post '/api/v1/tasks', params: valid_params, headers: auth_headers
        expect(response).to have_http_status(:created)
      end

      it 'creates a new task' do
        expect do
          post '/api/v1/tasks', params: valid_params, headers: auth_headers
        end.to change(Task, :count).by(1)
      end

      it 'returns success message' do
        post '/api/v1/tasks', params: valid_params, headers: auth_headers
        json_response = JSON.parse(response.body)

        expect(json_response).to include(
          'success' => true,
          'message' => 'タスクが正常に作成されました'
        )
      end

      it 'automatically sets account_id to current user' do
        post '/api/v1/tasks', params: valid_params, headers: auth_headers
        created_task = Task.last
        expect(created_task.account_id).to eq(user_id)
      end

      it 'creates task with minimal required params (title only)' do
        minimal_params = { task: { title: 'Minimal Task' } }

        post '/api/v1/tasks', params: minimal_params, headers: auth_headers
        expect(response).to have_http_status(:created)

        json_response = JSON.parse(response.body)
        expect(json_response['success']).to be true
        expect(json_response['message']).to eq('タスクが正常に作成されました')

        created_task = Task.last
        expect(created_task.title).to eq('Minimal Task')
        expect(created_task.account_id).to eq(user_id)
      end

      it 'handles various status values correctly' do
        %w(pending in_progress completed on_hold).each do |status|
          params = valid_params.dup
          params[:task][:status] = status

          post '/api/v1/tasks', params: params, headers: auth_headers
          expect(response).to have_http_status(:created)

          json_response = JSON.parse(response.body)
          expect(json_response['message']).to eq('タスクが正常に作成されました')

          created_task = Task.last
          expect(created_task.status).to eq(status)
        end
      end
    end

    context '異常系' do
      context 'バリデーションエラー' do
        it 'returns 422 when title is missing' do
          invalid_params = { task: { due_date: Date.current } }

          post '/api/v1/tasks', params: invalid_params, headers: auth_headers
          expect(response).to have_http_status(:unprocessable_entity)

          json_response = JSON.parse(response.body)
          expect(json_response['success']).to be false
          expect(json_response['errors']).to include('Title タイトルは必須です')
        end

        it 'returns 422 when title is too long' do
          long_title_params = { task: { title: 'a' * 256 } }

          post '/api/v1/tasks', params: long_title_params, headers: auth_headers
          expect(response).to have_http_status(:unprocessable_entity)

          json_response = JSON.parse(response.body)
          expect(json_response['success']).to be false
          expect(json_response['errors']).to include('Title タイトルは255文字以内で入力してください')
        end
      end

      context '認証関連' do
        it '認証が失敗した場合、適切なエラーを返すこと' do
          # authorize メソッドを直接オーバーライドして認証エラーをシミュレート
          allow_any_instance_of(ApplicationController).to receive(:authorize) do |controller|
            controller.render json: { message: 'Invalid token' }, status: :unauthorized
          end

          post '/api/v1/tasks', params: valid_params, headers: auth_headers

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

          post '/api/v1/tasks', params: valid_params, headers: auth_headers

          expect(response).to have_http_status(:forbidden)
          expect(JSON.parse(response.body)['message']).to eq('Permission denied')
        end
      end
    end

    context 'エッジケース' do
      it '最大長のタイトルで正常に作成される' do
        max_title_params = { task: { title: 'a' * 255 } }

        post '/api/v1/tasks', params: max_title_params, headers: auth_headers
        expect(response).to have_http_status(:created)

        json_response = JSON.parse(response.body)
        expect(json_response['success']).to be true
        expect(json_response['message']).to eq('タスクが正常に作成されました')

        created_task = Task.last
        expect(created_task.title).to eq('a' * 255)
      end

      it '特殊文字を含むタイトルで正常に作成される' do
        special_params = { task: { title: 'タスク (重要) - 緊急対応が必要です！' } }

        post '/api/v1/tasks', params: special_params, headers: auth_headers
        expect(response).to have_http_status(:created)

        json_response = JSON.parse(response.body)
        expect(json_response['success']).to be true
        expect(json_response['message']).to eq('タスクが正常に作成されました')

        created_task = Task.last
        expect(created_task.title).to eq('タスク (重要) - 緊急対応が必要です！')
      end

      it 'due_dateがnilでも正常に作成される' do
        no_due_date_params = { task: { title: 'No due date task', due_date: nil } }

        post '/api/v1/tasks', params: no_due_date_params, headers: auth_headers
        expect(response).to have_http_status(:created)

        json_response = JSON.parse(response.body)
        expect(json_response['success']).to be true
        expect(json_response['message']).to eq('タスクが正常に作成されました')

        created_task = Task.last
        expect(created_task.due_date).to be_nil
      end
    end
  end
end
