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
