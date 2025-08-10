require 'rails_helper'

RSpec.describe 'Tasks API', type: :request do
  let(:user_id) { 'test-user-id' }
  let(:dummy_token) { 'dummy-token' }
  let(:auth_headers) { { 'Authorization' => "Bearer #{dummy_token}", 'Host' => 'localhost' } }

  before do
    # テスト環境でのみ認証をスキップ
    mock_request_authentication(user_id: user_id)
  end

  describe 'GET /api/v1/tasks' do
    context '正常系' do
      before do
        create_list(:task, 3, account_id: user_id)
      end

      it 'returns a successful response' do
        get '/api/v1/tasks', headers: auth_headers
        expect(response).to have_http_status(:ok)
      end

      it 'returns the expected JSON structure' do
        get '/api/v1/tasks', headers: auth_headers
        json_response = JSON.parse(response.body)
        expect(json_response['data']).to be_an(Array)
        expect(json_response['data'].length).to eq(3)
      end

      it 'returns tasks for the authenticated user only' do
        other_user_task = create(:task, account_id: 'other-user')
        get '/api/v1/tasks', headers: auth_headers

        json_response = JSON.parse(response.body)
        task_ids = json_response['data'].map { |task| task['id'] }

        expect(task_ids).to include(*Task.where(account_id: user_id).pluck(:id))
        expect(task_ids).not_to include(other_user_task.id)
      end

      it 'returns correct task attributes' do
        task = create(:task, account_id: user_id, title: 'Test Task')
        get '/api/v1/tasks', headers: auth_headers

        json_response = JSON.parse(response.body)
        returned_task = json_response['data'].find { |t| t['id'] == task.id }

        expect(returned_task).to include(
          'id' => task.id,
          'accountId' => task.account_id,
          'title' => task.title,
          'status' => task.status,
          'priority' => task.priority,
          'category' => task.category
        )
        expect(returned_task['dueDate']).to eq(task.due_date&.iso8601)
        expect(returned_task['createdAt']).to eq(task.created_at.iso8601(3))
        expect(returned_task['updatedAt']).to eq(task.updated_at.iso8601(3))
      end
    end

    context '異常系' do
      context '認証関連' do
        it '認証が失敗した場合、適切なエラーを返すこと' do
          # authorize メソッドを直接オーバーライドして認証エラーをシミュレート
          allow_any_instance_of(ApplicationController).to receive(:authorize) do |controller|
            controller.render json: { message: 'Invalid token' }, status: :unauthorized
          end

          get '/api/v1/tasks', headers: auth_headers

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

          get '/api/v1/tasks', headers: auth_headers

          expect(response).to have_http_status(:forbidden)
          expect(JSON.parse(response.body)['message']).to eq('Permission denied')
        end
      end

      context 'データベースエラー' do
        it 'データベースエラーが発生した場合、500エラーを返すこと' do
          allow(Task).to receive(:for_user).and_raise(ActiveRecord::StatementInvalid, 'Database error')

          get '/api/v1/tasks', headers: auth_headers

          expect(response).to have_http_status(:internal_server_error)
        end
      end
    end

    context 'エッジケース' do
      it 'タスクが存在しない場合、空の配列を返すこと' do
        get '/api/v1/tasks', headers: auth_headers

        json_response = JSON.parse(response.body)
        expect(json_response['data']).to eq([])
      end

      it '大量のタスクがある場合でも正常に動作すること' do
        create_list(:task, 100, account_id: user_id)

        get '/api/v1/tasks', headers: auth_headers

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        expect(json_response['data'].length).to eq(100)
      end
    end
  end

  describe 'POST /api/v1/tasks' do
    let(:valid_params) do
      {
        task: {
          title: 'New Task',
          due_date: Date.current + 1.week,
          status: '未着手',
          priority: 'high',
          category: '仕事'
        }
      }
    end

    context '正常系' do
      it 'returns a successful response with 201 status' do
        post '/api/v1/tasks', params: valid_params, headers: auth_headers
        expect(response).to have_http_status(:created)
      end

      it 'creates a new task' do
        expect {
          post '/api/v1/tasks', params: valid_params, headers: auth_headers
        }.to change(Task, :count).by(1)
      end

      it 'returns success message' do
        post '/api/v1/tasks', params: valid_params, headers: auth_headers
        json_response = JSON.parse(response.body)

        expect(json_response).to include(
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
        expect(json_response['message']).to eq('タスクが正常に作成されました')

        created_task = Task.last
        expect(created_task.title).to eq('Minimal Task')
        expect(created_task.account_id).to eq(user_id)
      end

      it 'handles various status values correctly' do
        %w[未着手 進行中 完了].each do |status|
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
          expect(json_response['errors']).to include("Title can't be blank")
        end

        it 'returns 422 when title is too long' do
          long_title_params = { task: { title: 'a' * 256 } }

          post '/api/v1/tasks', params: long_title_params, headers: auth_headers
          expect(response).to have_http_status(:unprocessable_entity)

          json_response = JSON.parse(response.body)
          expect(json_response['errors']).to include('Title is too long (maximum is 255 characters)')
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
        expect(json_response['message']).to eq('タスクが正常に作成されました')

        created_task = Task.last
        expect(created_task.title).to eq('a' * 255)
      end

      it '特殊文字を含むタイトルで正常に作成される' do
        special_params = { task: { title: 'タスク (重要) - 緊急対応が必要です！' } }

        post '/api/v1/tasks', params: special_params, headers: auth_headers
        expect(response).to have_http_status(:created)

        json_response = JSON.parse(response.body)
        expect(json_response['message']).to eq('タスクが正常に作成されました')

        created_task = Task.last
        expect(created_task.title).to eq('タスク (重要) - 緊急対応が必要です！')
      end

      it 'due_dateがnilでも正常に作成される' do
        no_due_date_params = { task: { title: 'No due date task', due_date: nil } }

        post '/api/v1/tasks', params: no_due_date_params, headers: auth_headers
        expect(response).to have_http_status(:created)

        json_response = JSON.parse(response.body)
        expect(json_response['message']).to eq('タスクが正常に作成されました')

        created_task = Task.last
        expect(created_task.due_date).to be_nil
      end
    end
  end

  describe '認証・認可' do
    it 'current_user_idが正しく取得されること' do
      # Request Specでは直接controller instanceにアクセスできないため、
      # 実際のリクエストを通じて認証状態を確認
      get '/api/v1/tasks', headers: auth_headers
      expect(response).to have_http_status(:ok)

      # レスポンスのタスクデータでuser_idが正しく設定されていることを確認
      create(:task, account_id: user_id, title: 'Test Auth')
      get '/api/v1/tasks', headers: auth_headers
      json_response = JSON.parse(response.body)
      expect(json_response['data'].first['accountId']).to eq(user_id)
    end

    it 'validate_permissionsが正しく動作すること' do
      # 正常な権限の場合、リクエストが成功することを確認
      get '/api/v1/tasks', headers: auth_headers
      expect(response).to have_http_status(:ok)
    end
  end
end
