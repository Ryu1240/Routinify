require 'rails_helper'
require_relative 'shared_context'

RSpec.describe 'DELETE /api/v1/tasks/:id', type: :request do
  include_context 'tasks request spec setup'

  let(:category) { create(:category, account_id: user_id, name: '仕事') }
  let!(:task) { create(:task, account_id: user_id, title: 'Task to Delete', status: 'pending', priority: 'medium', category_id: category.id) }

  describe 'DELETE /api/v1/tasks/:id' do
    context '正常系' do
      it 'returns a successful response with 204 status' do
        delete "/api/v1/tasks/#{task.id}", headers: auth_headers
        expect(response).to have_http_status(:no_content)
      end

      it 'returns no body' do
        delete "/api/v1/tasks/#{task.id}", headers: auth_headers
        expect(response.body).to be_empty
      end

      it 'deletes the task from database' do
        expect do
          delete "/api/v1/tasks/#{task.id}", headers: auth_headers
        end.to change(Task, :count).by(-1)
      end

      it 'task can no longer be found' do
        delete "/api/v1/tasks/#{task.id}", headers: auth_headers
        expect(Task.find_by(id: task.id)).to be_nil
      end
    end

    context '異常系' do
      context 'タスクが存在しない場合' do
        it 'returns 404 when task does not exist' do
          delete '/api/v1/tasks/99999', headers: auth_headers
          expect(response).to have_http_status(:not_found)

          json_response = JSON.parse(response.body)
          expect(json_response['errors']).to include('タスクが見つかりません')
        end

        it 'does not delete any tasks' do
          expect do
            delete '/api/v1/tasks/99999', headers: auth_headers
          end.not_to change(Task, :count)
        end
      end

      context '他のユーザーのタスクを削除しようとした場合' do
        let!(:other_user_task) { create(:task, account_id: 'other-user', title: 'Other User Task') }

        it 'returns 404 when trying to delete another users task' do
          delete "/api/v1/tasks/#{other_user_task.id}", headers: auth_headers
          expect(response).to have_http_status(:not_found)

          json_response = JSON.parse(response.body)
          expect(json_response['errors']).to include('タスクが見つかりません')
        end

        it 'does not delete the other users task' do
          expect do
            delete "/api/v1/tasks/#{other_user_task.id}", headers: auth_headers
          end.not_to change(Task, :count)

          # タスクがまだ存在することを確認
          expect(Task.find_by(id: other_user_task.id)).not_to be_nil
        end
      end

      context '認証関連' do
        it '認証が失敗した場合、適切なエラーを返すこと' do
          allow_any_instance_of(ApplicationController).to receive(:authorize) do |controller|
            controller.render json: { message: 'Invalid token' }, status: :unauthorized
          end

          delete "/api/v1/tasks/#{task.id}", headers: auth_headers

          expect(response).to have_http_status(:unauthorized)
          expect(JSON.parse(response.body)['message']).to eq('Invalid token')
        end

        it '認証が失敗した場合、タスクを削除しないこと' do
          allow_any_instance_of(ApplicationController).to receive(:authorize) do |controller|
            controller.render json: { message: 'Invalid token' }, status: :unauthorized
          end

          expect do
            delete "/api/v1/tasks/#{task.id}", headers: auth_headers
          end.not_to change(Task, :count)
        end
      end

      context '権限関連' do
        it '権限が不足している場合、403エラーを返すこと' do
          allow_any_instance_of(ApplicationController).to receive(:validate_permissions) do |controller|
            controller.render json: { message: 'Permission denied' }, status: :forbidden
          end

          delete "/api/v1/tasks/#{task.id}", headers: auth_headers

          expect(response).to have_http_status(:forbidden)
          expect(JSON.parse(response.body)['message']).to eq('Permission denied')
        end

        it '権限が不足している場合、タスクを削除しないこと' do
          allow_any_instance_of(ApplicationController).to receive(:validate_permissions) do |controller|
            controller.render json: { message: 'Permission denied' }, status: :forbidden
          end

          expect do
            delete "/api/v1/tasks/#{task.id}", headers: auth_headers
          end.not_to change(Task, :count)
        end
      end
    end

    context 'エッジケース' do
      it '複数回削除を試みても、2回目は404を返す' do
        # 1回目の削除
        delete "/api/v1/tasks/#{task.id}", headers: auth_headers
        expect(response).to have_http_status(:no_content)

        # 2回目の削除
        delete "/api/v1/tasks/#{task.id}", headers: auth_headers
        expect(response).to have_http_status(:not_found)
      end

      it '異なるユーザーのタスクが混在している場合、自分のタスクのみ削除できる' do
        other_user_task = create(:task, account_id: 'other-user', title: 'Other Task')

        expect do
          delete "/api/v1/tasks/#{task.id}", headers: auth_headers
        end.to change(Task, :count).by(-1)

        # 他ユーザーのタスクは残っている
        expect(Task.find_by(id: other_user_task.id)).not_to be_nil
      end
    end
  end
end
