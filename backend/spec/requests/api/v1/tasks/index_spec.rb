require 'rails_helper'
require_relative 'shared_context'

RSpec.describe 'GET /api/v1/tasks', type: :request do
  include_context 'tasks request spec setup'

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

        expect(task_ids).to include(*Task.active.where(account_id: user_id).pluck(:id))
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
          'categoryId' => task.category_id
        )
        expect(returned_task['dueDate']).to eq(task.due_date&.iso8601)
        expect(returned_task['createdAt']).to eq(task.created_at.iso8601)
        expect(returned_task['updatedAt']).to eq(task.updated_at.iso8601)
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

    context '複数ステータスフィルタリング' do
      before do
        create(:task, account_id: user_id, status: 'pending')
        create(:task, account_id: user_id, status: 'in_progress')
        create(:task, account_id: user_id, status: 'completed')
        create(:task, account_id: user_id, status: 'on_hold')
      end

      it 'statuses=pending,in_progressで未完了と進行中のタスクのみを取得できること' do
        get '/api/v1/tasks', params: { statuses: 'pending,in_progress' }, headers: auth_headers

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        statuses = json_response['data'].map { |t| t['status'] }
        expect(statuses).to contain_exactly('pending', 'in_progress')
        expect(statuses).not_to include('completed', 'on_hold')
      end

      it 'statusesパラメータが空の場合、すべてのタスクを返すこと' do
        get '/api/v1/tasks', params: { statuses: '' }, headers: auth_headers

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        expect(json_response['data'].length).to eq(4)
      end

      it '無効なステータスが含まれている場合、有効なステータスのみでフィルタリングすること' do
        get '/api/v1/tasks', params: { statuses: 'pending,invalid_status' }, headers: auth_headers

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        statuses = json_response['data'].map { |t| t['status'] }
        expect(statuses).to contain_exactly('pending')
      end

      it '既存のstatusパラメータとの互換性を維持すること' do
        get '/api/v1/tasks', params: { status: 'pending' }, headers: auth_headers

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        statuses = json_response['data'].map { |t| t['status'] }
        expect(statuses).to all(eq('pending'))
      end
    end

    context '期限日でソート' do
      before do
        @task1 = create(:task, account_id: user_id, due_date: 3.days.from_now)
        @task2 = create(:task, account_id: user_id, due_date: 1.day.from_now)
        @task3 = create(:task, account_id: user_id, due_date: nil)
        @task4 = create(:task, account_id: user_id, due_date: 2.days.from_now)
      end

      it 'sort_by=due_date&sort_order=ascで期限日が近い順にソートされること' do
        get '/api/v1/tasks', params: { sort_by: 'due_date', sort_order: 'asc' }, headers: auth_headers

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        task_ids = json_response['data'].map { |t| t['id'] }

        # 期限日が近い順: task2 (1日後) -> task4 (2日後) -> task1 (3日後) -> task3 (NULL)
        expect(task_ids[0]).to eq(@task2.id)
        expect(task_ids[1]).to eq(@task4.id)
        expect(task_ids[2]).to eq(@task1.id)
        expect(task_ids[3]).to eq(@task3.id)
      end

      it 'sort_by=due_date&sort_order=descで期限日が遠い順にソートされること' do
        get '/api/v1/tasks', params: { sort_by: 'due_date', sort_order: 'desc' }, headers: auth_headers

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        task_ids = json_response['data'].map { |t| t['id'] }

        # 期限日が遠い順: task1 (3日後) -> task4 (2日後) -> task2 (1日後) -> task3 (NULL)
        expect(task_ids[0]).to eq(@task1.id)
        expect(task_ids[1]).to eq(@task4.id)
        expect(task_ids[2]).to eq(@task2.id)
        expect(task_ids[3]).to eq(@task3.id)
      end

      it 'due_dateがNULLのタスクは最後に配置されること' do
        get '/api/v1/tasks', params: { sort_by: 'due_date', sort_order: 'asc' }, headers: auth_headers

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        last_task = json_response['data'].last

        expect(last_task['dueDate']).to be_nil
        expect(last_task['id']).to eq(@task3.id)
      end

      it 'sort_byが指定されていない場合、デフォルトでcreated_atの降順でソートされること' do
        get '/api/v1/tasks', headers: auth_headers

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        task_ids = json_response['data'].map { |t| t['id'] }

        # 作成日時の降順（最新が最初）
        expect(task_ids.first).to eq(@task4.id)
        expect(task_ids.last).to eq(@task1.id)
      end
    end

    context '複合テスト' do
      before do
        @task1 = create(:task, account_id: user_id, status: 'pending', due_date: 3.days.from_now)
        @task2 = create(:task, account_id: user_id, status: 'in_progress', due_date: 1.day.from_now)
        @task3 = create(:task, account_id: user_id, status: 'completed', due_date: 2.days.from_now)
        @task4 = create(:task, account_id: user_id, status: 'pending', due_date: nil)
      end

      it '複数ステータスフィルタリングとソートを組み合わせた場合の動作' do
        get '/api/v1/tasks', params: { statuses: 'pending,in_progress', sort_by: 'due_date', sort_order: 'asc' }, headers: auth_headers

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        task_ids = json_response['data'].map { |t| t['id'] }
        statuses = json_response['data'].map { |t| t['status'] }

        # pendingとin_progressのみが取得される
        expect(statuses).to contain_exactly('pending', 'in_progress', 'pending')
        # 期限日が近い順: task2 -> task1 -> task4 (NULL)
        expect(task_ids[0]).to eq(@task2.id)
        expect(task_ids[1]).to eq(@task1.id)
        expect(task_ids[2]).to eq(@task4.id)
      end
    end
  end
end
