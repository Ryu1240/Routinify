require 'rails_helper'
require_relative 'shared_context'

RSpec.describe 'PUT /api/v1/tasks/:id', type: :request do
  include_context 'tasks request spec setup'

  let(:category) { create(:category, account_id: user_id, name: '仕事') }
  let(:new_category) { create(:category, account_id: user_id, name: 'プライベート') }
  let!(:task) { create(:task, account_id: user_id, title: 'Original Task', status: 'pending', priority: 'medium', category_id: category.id) }
  let(:valid_update_params) do
    {
      task: {
        title: 'Updated Task',
        status: 'in_progress',
        priority: 'high',
        category_id: new_category.id,
        due_date: Date.current + 2.weeks,
      },
    }
  end

  describe 'PUT /api/v1/tasks/:id' do
    context '正常系' do
      it 'returns a successful response with 200 status' do
        put "/api/v1/tasks/#{task.id}", params: valid_update_params, headers: auth_headers
        expect(response).to have_http_status(:ok)
      end

      it 'updates the task with new values' do
        put "/api/v1/tasks/#{task.id}", params: valid_update_params, headers: auth_headers

        task.reload
        expect(task.title).to eq('Updated Task')
        expect(task.status).to eq('in_progress')
        expect(task.priority).to eq('high')
        expect(task.category_id).to eq(new_category.id)
        expect(task.due_date).to eq(Date.current + 2.weeks)
      end

      it 'returns success message' do
        put "/api/v1/tasks/#{task.id}", params: valid_update_params, headers: auth_headers
        json_response = JSON.parse(response.body)

        expect(json_response).to include(
          'message' => 'タスクが正常に更新されました'
        )
      end

      it 'updates only specified fields' do
        partial_params = { task: { title: 'Partially Updated Task' } }

        put "/api/v1/tasks/#{task.id}", params: partial_params, headers: auth_headers

        task.reload
        expect(task.title).to eq('Partially Updated Task')
        expect(task.status).to eq('pending') # 元のまま
        expect(task.priority).to eq('medium') # 元のまま
      end

      it 'handles nil values correctly' do
        nil_params = { task: { due_date: nil, status: nil } }

        put "/api/v1/tasks/#{task.id}", params: nil_params, headers: auth_headers

        task.reload
        expect(task.due_date).to be_nil
        expect(task.status).to be_nil
      end
    end

    context '異常系' do
      context 'タスクが存在しない場合' do
        it 'returns 404 when task does not exist' do
          put '/api/v1/tasks/99999', params: valid_update_params, headers: auth_headers
          expect(response).to have_http_status(:not_found)

          json_response = JSON.parse(response.body)
          expect(json_response['errors']).to include('タスクが見つかりません')
        end
      end

      context '他のユーザーのタスクを更新しようとした場合' do
        let!(:other_user_task) { create(:task, account_id: 'other-user', title: 'Other User Task', status: 'pending') }

        it 'returns 404 when trying to update another users task' do
          put "/api/v1/tasks/#{other_user_task.id}", params: valid_update_params, headers: auth_headers
          expect(response).to have_http_status(:not_found)

          json_response = JSON.parse(response.body)
          expect(json_response['errors']).to include('タスクが見つかりません')
        end

        it 'does not update the other users task' do
          original_title = other_user_task.title
          put "/api/v1/tasks/#{other_user_task.id}", params: valid_update_params, headers: auth_headers

          other_user_task.reload
          expect(other_user_task.title).to eq(original_title)
        end
      end

      context 'バリデーションエラー' do
        it 'returns 422 when title is blank' do
          invalid_params = { task: { title: '' } }

          put "/api/v1/tasks/#{task.id}", params: invalid_params, headers: auth_headers
          expect(response).to have_http_status(:unprocessable_entity)

          json_response = JSON.parse(response.body)
          expect(json_response['errors']).to include('Title タイトルは必須です')
        end

        it 'returns 422 when title is too long' do
          long_title_params = { task: { title: 'a' * 256 } }

          put "/api/v1/tasks/#{task.id}", params: long_title_params, headers: auth_headers
          expect(response).to have_http_status(:unprocessable_entity)

          json_response = JSON.parse(response.body)
          expect(json_response['errors']).to include('Title タイトルは255文字以内で入力してください')
        end

        it 'does not update task when validation fails' do
          original_title = task.title
          invalid_params = { task: { title: '' } }

          put "/api/v1/tasks/#{task.id}", params: invalid_params, headers: auth_headers

          task.reload
          expect(task.title).to eq(original_title)
        end
      end

      context '認証関連' do
        it '認証が失敗した場合、適切なエラーを返すこと' do
          allow_any_instance_of(ApplicationController).to receive(:authorize) do |controller|
            controller.render json: { message: 'Invalid token' }, status: :unauthorized
          end

          put "/api/v1/tasks/#{task.id}", params: valid_update_params, headers: auth_headers

          expect(response).to have_http_status(:unauthorized)
          expect(JSON.parse(response.body)['message']).to eq('Invalid token')
        end
      end

      context '権限関連' do
        it '権限が不足している場合、403エラーを返すこと' do
          allow_any_instance_of(ApplicationController).to receive(:validate_permissions) do |controller|
            controller.render json: { message: 'Permission denied' }, status: :forbidden
          end

          put "/api/v1/tasks/#{task.id}", params: valid_update_params, headers: auth_headers

          expect(response).to have_http_status(:forbidden)
          expect(JSON.parse(response.body)['message']).to eq('Permission denied')
        end
      end
    end

    context 'エッジケース' do
      it '最大長のタイトルで正常に更新される' do
        max_title_params = { task: { title: 'a' * 255 } }

        put "/api/v1/tasks/#{task.id}", params: max_title_params, headers: auth_headers
        expect(response).to have_http_status(:ok)

        task.reload
        expect(task.title).to eq('a' * 255)
      end

      it '特殊文字を含むタイトルで正常に更新される' do
        special_params = { task: { title: 'Updated タスク (重要) - 緊急対応が必要です！' } }

        put "/api/v1/tasks/#{task.id}", params: special_params, headers: auth_headers
        expect(response).to have_http_status(:ok)

        task.reload
        expect(task.title).to eq('Updated タスク (重要) - 緊急対応が必要です！')
      end

      it 'due_dateがnilでも正常に更新される' do
        no_due_date_params = { task: { due_date: nil } }

        put "/api/v1/tasks/#{task.id}", params: no_due_date_params, headers: auth_headers
        expect(response).to have_http_status(:ok)

        task.reload
        expect(task.due_date).to be_nil
      end

      it '各ステータス値で正常に更新される' do
        %w(pending in_progress completed on_hold).each do |status|
          params = { task: { status: status } }

          put "/api/v1/tasks/#{task.id}", params: params, headers: auth_headers
          expect(response).to have_http_status(:ok)

          task.reload
          expect(task.status).to eq(status)
        end
      end
    end
  end
end
