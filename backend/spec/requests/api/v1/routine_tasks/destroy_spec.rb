require 'rails_helper'
require_relative 'shared_context'

RSpec.describe 'DELETE /api/v1/routine_tasks/:id', type: :request do
  include_context 'routine_tasks request spec setup'

  let(:category) { create(:category, account_id: user_id, name: '仕事') }
  let!(:routine_task) { create(:routine_task, account_id: user_id, title: 'Test Routine Task', frequency: 'daily', priority: 'medium', category_id: category.id) }

  describe 'DELETE /api/v1/routine_tasks/:id' do
    context '正常系' do
      it 'returns a successful response with 204 status' do
        delete "/api/v1/routine_tasks/#{routine_task.id}", headers: auth_headers
        expect(response).to have_http_status(:no_content)
      end

      it 'returns no body' do
        delete "/api/v1/routine_tasks/#{routine_task.id}", headers: auth_headers
        expect(response.body).to be_empty
      end

      it 'deletes the routine_task' do
        expect do
          delete "/api/v1/routine_tasks/#{routine_task.id}", headers: auth_headers
        end.to change(RoutineTask, :count).by(-1)
      end

      it 'routine_task no longer exists after deletion' do
        delete "/api/v1/routine_tasks/#{routine_task.id}", headers: auth_headers
        expect(RoutineTask.find_by(id: routine_task.id)).to be_nil
      end
    end

    context '異常系' do
      context '習慣化タスクが存在しない場合' do
        it 'returns 404 when routine_task does not exist' do
          delete '/api/v1/routine_tasks/99999', headers: auth_headers
          expect(response).to have_http_status(:not_found)

          json_response = JSON.parse(response.body)
          expect(json_response['errors']).to include('習慣化タスクが見つかりません')
        end

        it 'does not change the routine_task count' do
          expect do
            delete '/api/v1/routine_tasks/99999', headers: auth_headers
          end.not_to change(RoutineTask, :count)
        end
      end

      context '他のユーザーの習慣化タスクを削除しようとした場合' do
        let!(:other_user_routine_task) { create(:routine_task, account_id: 'other-user', title: 'Other User Routine Task', frequency: 'daily') }

        it 'returns 404 when trying to delete another users routine_task' do
          delete "/api/v1/routine_tasks/#{other_user_routine_task.id}", headers: auth_headers
          expect(response).to have_http_status(:not_found)

          json_response = JSON.parse(response.body)
          expect(json_response['errors']).to include('習慣化タスクが見つかりません')
        end

        it 'does not delete the other users routine_task' do
          expect do
            delete "/api/v1/routine_tasks/#{other_user_routine_task.id}", headers: auth_headers
          end.not_to change(RoutineTask, :count)

          expect(RoutineTask.find_by(id: other_user_routine_task.id)).to be_present
        end
      end

      context '認証関連' do
        it '認証が失敗した場合、適切なエラーを返すこと' do
          allow_any_instance_of(ApplicationController).to receive(:authorize) do |controller|
            controller.render json: { message: 'Invalid token' }, status: :unauthorized
          end

          delete "/api/v1/routine_tasks/#{routine_task.id}", headers: auth_headers

          expect(response).to have_http_status(:unauthorized)
          expect(JSON.parse(response.body)['message']).to eq('Invalid token')
        end

        it '認証が失敗した場合、習慣化タスクを削除しないこと' do
          allow_any_instance_of(ApplicationController).to receive(:authorize) do |controller|
            controller.render json: { message: 'Invalid token' }, status: :unauthorized
          end

          expect do
            delete "/api/v1/routine_tasks/#{routine_task.id}", headers: auth_headers
          end.not_to change(RoutineTask, :count)
        end
      end

      context '権限関連' do
        it '権限が不足している場合、403エラーを返すこと' do
          allow_any_instance_of(ApplicationController).to receive(:validate_permissions) do |controller|
            controller.render json: { message: 'Permission denied' }, status: :forbidden
          end

          delete "/api/v1/routine_tasks/#{routine_task.id}", headers: auth_headers

          expect(response).to have_http_status(:forbidden)
          expect(JSON.parse(response.body)['message']).to eq('Permission denied')
        end

        it '権限が不足している場合、習慣化タスクを削除しないこと' do
          allow_any_instance_of(ApplicationController).to receive(:validate_permissions) do |controller|
            controller.render json: { message: 'Permission denied' }, status: :forbidden
          end

          expect do
            delete "/api/v1/routine_tasks/#{routine_task.id}", headers: auth_headers
          end.not_to change(RoutineTask, :count)
        end
      end
    end

    context 'エッジケース' do
      context '関連するタスクがある場合' do
        let!(:routine_task_with_tasks) { create(:routine_task, account_id: user_id, title: 'Routine Task with Tasks', frequency: 'daily') }
        let!(:generated_task1) { create(:task, account_id: user_id, routine_task_id: routine_task_with_tasks.id, title: 'Generated Task 1', generated_at: 1.day.ago) }
        let!(:generated_task2) { create(:task, account_id: user_id, routine_task_id: routine_task_with_tasks.id, title: 'Generated Task 2', generated_at: 2.days.ago) }

        it 'deletes the routine_task successfully' do
          delete "/api/v1/routine_tasks/#{routine_task_with_tasks.id}", headers: auth_headers
          expect(response).to have_http_status(:no_content)

          expect(RoutineTask.find_by(id: routine_task_with_tasks.id)).to be_nil
        end

        it 'physically deletes related tasks (including soft-deleted ones)' do
          delete "/api/v1/routine_tasks/#{routine_task_with_tasks.id}", headers: auth_headers

          expect(Task.with_deleted.find_by(id: generated_task1.id)).to be_nil
          expect(Task.with_deleted.find_by(id: generated_task2.id)).to be_nil
        end
      end

      context 'カテゴリが関連付けられている場合' do
        let!(:routine_task_with_category) { create(:routine_task, account_id: user_id, title: 'Categorized Routine Task', category_id: category.id, frequency: 'weekly') }

        it 'deletes the routine_task successfully' do
          delete "/api/v1/routine_tasks/#{routine_task_with_category.id}", headers: auth_headers
          expect(response).to have_http_status(:no_content)

          expect(RoutineTask.find_by(id: routine_task_with_category.id)).to be_nil
        end

        it 'does not delete the category' do
          expect do
            delete "/api/v1/routine_tasks/#{routine_task_with_category.id}", headers: auth_headers
          end.not_to change(Category, :count)

          expect(Category.find_by(id: category.id)).to be_present
        end
      end

      context '異なるfrequencyの習慣タスク' do
        it 'daily頻度の習慣タスクが正常に削除される' do
          daily_task = create(:routine_task, :daily, account_id: user_id, title: 'Daily Task')

          delete "/api/v1/routine_tasks/#{daily_task.id}", headers: auth_headers
          expect(response).to have_http_status(:no_content)
          expect(RoutineTask.find_by(id: daily_task.id)).to be_nil
        end

        it 'weekly頻度の習慣タスクが正常に削除される' do
          weekly_task = create(:routine_task, :weekly, account_id: user_id, title: 'Weekly Task')

          delete "/api/v1/routine_tasks/#{weekly_task.id}", headers: auth_headers
          expect(response).to have_http_status(:no_content)
          expect(RoutineTask.find_by(id: weekly_task.id)).to be_nil
        end

        it 'monthly頻度の習慣タスクが正常に削除される' do
          monthly_task = create(:routine_task, :monthly, account_id: user_id, title: 'Monthly Task')

          delete "/api/v1/routine_tasks/#{monthly_task.id}", headers: auth_headers
          expect(response).to have_http_status(:no_content)
          expect(RoutineTask.find_by(id: monthly_task.id)).to be_nil
        end

        it 'custom頻度の習慣タスクが正常に削除される' do
          custom_task = create(:routine_task, :custom, account_id: user_id, title: 'Custom Task')

          delete "/api/v1/routine_tasks/#{custom_task.id}", headers: auth_headers
          expect(response).to have_http_status(:no_content)
          expect(RoutineTask.find_by(id: custom_task.id)).to be_nil
        end
      end

      it '複数回削除を試みても、2回目は404を返す' do
        # 1回目の削除
        delete "/api/v1/routine_tasks/#{routine_task.id}", headers: auth_headers
        expect(response).to have_http_status(:no_content)

        # 2回目の削除
        delete "/api/v1/routine_tasks/#{routine_task.id}", headers: auth_headers
        expect(response).to have_http_status(:not_found)
      end

      it '異なるユーザーの習慣タスクが混在している場合、自分の習慣タスクのみ削除できる' do
        other_user_routine_task = create(:routine_task, account_id: 'other-user', title: 'Other Routine Task')

        expect do
          delete "/api/v1/routine_tasks/#{routine_task.id}", headers: auth_headers
        end.to change(RoutineTask, :count).by(-1)

        # 他ユーザーの習慣タスクは残っている
        expect(RoutineTask.find_by(id: other_user_routine_task.id)).not_to be_nil
      end
    end
  end
end
