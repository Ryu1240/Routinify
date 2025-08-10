require 'rails_helper'

RSpec.describe Api::V1::TasksController, type: :controller do
  let(:user_id) { 'test-user-id' }
  let(:dummy_token) { 'dummy-token' }

  before do
    mock_controller_authentication(controller, user_id: user_id)
  end

  describe 'GET #index' do
    context '正常系' do
      before do
        create_list(:task, 3, account_id: user_id)
        request.headers['Authorization'] = "Bearer #{dummy_token}"
      end

      it 'returns a successful response' do
        get :index
        expect(response).to have_http_status(:ok)
      end

      it 'returns the expected JSON structure' do
        get :index
        json_response = JSON.parse(response.body)
        expect(json_response['data']).to be_an(Array)
        expect(json_response['data'].length).to eq(3)
      end

      it 'returns tasks for the authenticated user only' do
        other_user_task = create(:task, account_id: 'other-user')
        get :index

        json_response = JSON.parse(response.body)
        task_ids = json_response['data'].map { |task| task['id'] }

        expect(task_ids).to include(*Task.where(account_id: user_id).pluck(:id))
        expect(task_ids).not_to include(other_user_task.id)
      end

      it 'returns correct task attributes' do
        task = create(:task, account_id: user_id, title: 'Test Task')
        get :index

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
          # 認証モックを無効化して実際の認証処理を実行
          allow_any_instance_of(ApplicationController).to receive(:authorize).and_call_original
          allow(Auth0Client).to receive(:validate_token).and_raise(StandardError, 'Auth failed')

          request.headers['Authorization'] = "Bearer #{dummy_token}"

          # 例外が発生することを期待
          expect { get :index }.to raise_error(StandardError, 'Auth failed')
        end
      end

      context '権限関連' do
        it '権限が不足している場合、403エラーを返すこと' do
          # validate_permissionsをfalseにモック
          decoded_token = controller.instance_variable_get(:@decoded_token)
          allow(decoded_token).to receive(:validate_permissions).and_return(false)

          request.headers['Authorization'] = "Bearer #{dummy_token}"
          get :index

          expect(response).to have_http_status(:forbidden)
        end
      end

      context 'データベースエラー' do
        it 'データベースエラーが発生した場合、適切にハンドリングされること' do
          allow(Task).to receive(:for_user).and_raise(ActiveRecord::StatementInvalid, 'Database error')

          request.headers['Authorization'] = "Bearer #{dummy_token}"

          # 例外が発生することを期待
          expect { get :index }.to raise_error(ActiveRecord::StatementInvalid, 'Database error')
        end
      end
    end

    context 'エッジケース' do
      it 'タスクが存在しない場合、空の配列を返すこと' do
        request.headers['Authorization'] = "Bearer #{dummy_token}"
        get :index

        json_response = JSON.parse(response.body)
        expect(json_response['data']).to eq([])
      end

      it '大量のタスクがある場合でも正常に動作すること' do
        create_list(:task, 100, account_id: user_id)
        request.headers['Authorization'] = "Bearer #{dummy_token}"

        get :index

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        expect(json_response['data'].length).to eq(100)
      end
    end
  end

  describe 'POST #create' do
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
      before do
        request.headers['Authorization'] = "Bearer #{dummy_token}"
      end

      it 'returns a successful response with 201 status' do
        post :create, params: valid_params
        expect(response).to have_http_status(:created)
      end

      it 'creates a new task' do
        expect {
          post :create, params: valid_params
        }.to change(Task, :count).by(1)
      end

      it 'returns the created task in camelCase format' do
        post :create, params: valid_params
        json_response = JSON.parse(response.body)

        expect(json_response).to include(
          'id' => be_a(Integer),
          'accountId' => user_id,
          'title' => 'New Task',
          'status' => '未着手',
          'priority' => 'high',
          'category' => '仕事'
        )
        expect(json_response['dueDate']).to eq((Date.current + 1.week).iso8601)
      end

      it 'automatically sets account_id to current user' do
        post :create, params: valid_params
        created_task = Task.last
        expect(created_task.account_id).to eq(user_id)
      end

      it 'creates task with minimal required params (title only)' do
        minimal_params = { task: { title: 'Minimal Task' } }

        post :create, params: minimal_params
        expect(response).to have_http_status(:created)

        json_response = JSON.parse(response.body)
        expect(json_response['title']).to eq('Minimal Task')
        expect(json_response['accountId']).to eq(user_id)
      end

      it 'handles various status values correctly' do
        %w[未着手 進行中 完了].each do |status|
          params = valid_params.dup
          params[:task][:status] = status

          post :create, params: params
          expect(response).to have_http_status(:created)

          json_response = JSON.parse(response.body)
          expect(json_response['status']).to eq(status)
        end
      end
    end

    context '異常系' do
      context 'バリデーションエラー' do
        before do
          request.headers['Authorization'] = "Bearer #{dummy_token}"
        end

        it 'returns 422 when title is missing' do
          invalid_params = { task: { due_date: Date.current } }

          post :create, params: invalid_params
          expect(response).to have_http_status(:unprocessable_entity)

          json_response = JSON.parse(response.body)
          expect(json_response['errors']).to include("Title can't be blank")
        end

        it 'returns 422 when title is too long' do
          long_title_params = { task: { title: 'a' * 256 } }

          post :create, params: long_title_params
          expect(response).to have_http_status(:unprocessable_entity)

          json_response = JSON.parse(response.body)
          expect(json_response['errors']).to include('Title is too long (maximum is 255 characters)')
        end
      end

      context '認証関連' do
        it '認証が失敗した場合、適切なエラーを返すこと' do
          allow_any_instance_of(ApplicationController).to receive(:authorize).and_call_original
          allow(Auth0Client).to receive(:validate_token).and_raise(StandardError, 'Auth failed')

          request.headers['Authorization'] = "Bearer #{dummy_token}"

          expect { post :create, params: valid_params }.to raise_error(StandardError, 'Auth failed')
        end
      end

      context '権限関連' do
        it '権限が不足している場合、403エラーを返すこと' do
          decoded_token = controller.instance_variable_get(:@decoded_token)
          allow(decoded_token).to receive(:validate_permissions).and_return(false)

          request.headers['Authorization'] = "Bearer #{dummy_token}"
          post :create, params: valid_params

          expect(response).to have_http_status(:forbidden)
        end
      end
    end

    context 'エッジケース' do
      before do
        request.headers['Authorization'] = "Bearer #{dummy_token}"
      end

      it '最大長のタイトルで正常に作成される' do
        max_title_params = { task: { title: 'a' * 255 } }

        post :create, params: max_title_params
        expect(response).to have_http_status(:created)

        json_response = JSON.parse(response.body)
        expect(json_response['title']).to eq('a' * 255)
      end

      it '特殊文字を含むタイトルで正常に作成される' do
        special_params = { task: { title: 'タスク (重要) - 緊急対応が必要です！' } }

        post :create, params: special_params
        expect(response).to have_http_status(:created)

        json_response = JSON.parse(response.body)
        expect(json_response['title']).to eq('タスク (重要) - 緊急対応が必要です！')
      end

      it 'due_dateがnilでも正常に作成される' do
        no_due_date_params = { task: { title: 'No due date task', due_date: nil } }

        post :create, params: no_due_date_params
        expect(response).to have_http_status(:created)

        json_response = JSON.parse(response.body)
        expect(json_response['dueDate']).to be_nil
      end
    end
  end

  describe '認証・認可' do
    it 'current_user_idが正しく取得されること' do
      expect(controller.send(:current_user_id)).to eq(user_id)
    end

    it 'validate_permissionsが正しく動作すること' do
      decoded_token = controller.instance_variable_get(:@decoded_token)
      expect(decoded_token.validate_permissions([ 'read:tasks' ])).to be true
    end
  end
end
