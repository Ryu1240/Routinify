require 'rails_helper'
require_relative 'shared_context'

RSpec.describe 'DELETE /api/v1/milestones/:id', type: :request do
  include_context 'milestones request spec setup'

  let!(:milestone) do
    create(:milestone,
           account_id: user_id,
           name: 'Milestone to Delete',
           description: 'Description',
           start_date: Date.current + 1.week,
           due_date: Date.current + 2.weeks,
           status: 'planning',
           completed_at: nil)
  end

  describe 'DELETE /api/v1/milestones/:id' do
    context '正常系' do
      it 'returns a successful response with 204 status' do
        delete "/api/v1/milestones/#{milestone.id}", headers: auth_headers
        expect(response).to have_http_status(:no_content)
      end

      it 'returns no body' do
        delete "/api/v1/milestones/#{milestone.id}", headers: auth_headers
        expect(response.body).to be_empty
      end

      it 'deletes the milestone from database' do
        expect do
          delete "/api/v1/milestones/#{milestone.id}", headers: auth_headers
        end.to change(Milestone, :count).by(-1)
      end

      it 'milestone can no longer be found' do
        delete "/api/v1/milestones/#{milestone.id}", headers: auth_headers
        expect(Milestone.find_by(id: milestone.id)).to be_nil
      end

      context '関連付けられたタスクがある場合' do
        let!(:milestone_with_tasks) do
          create(:milestone,
                 account_id: user_id,
                 name: 'Milestone with Tasks',
                 description: 'Description',
                 start_date: Date.current + 1.week,
                 due_date: Date.current + 2.weeks,
                 status: 'planning')
        end
        let!(:task1) { create(:task, account_id: user_id, title: 'Task 1') }
        let!(:task2) { create(:task, account_id: user_id, title: 'Task 2') }
        let!(:milestone_task1) { create(:milestone_task, milestone: milestone_with_tasks, task: task1) }
        let!(:milestone_task2) { create(:milestone_task, milestone: milestone_with_tasks, task: task2) }

        before do
          # テスト実行前にデータが確実に存在することを確認
          expect(Milestone.find_by(id: milestone_with_tasks.id)).to be_present
          expect(MilestoneTask.where(milestone_id: milestone_with_tasks.id).count).to eq(2)
        end

        it 'マイルストーンを削除する' do
          expect do
            delete "/api/v1/milestones/#{milestone_with_tasks.id}", headers: auth_headers
          end.to change(Milestone, :count).by(-1)
        end

        it '関連付け（milestone_tasks）を削除する' do
          expect do
            delete "/api/v1/milestones/#{milestone_with_tasks.id}", headers: auth_headers
          end.to change(MilestoneTask, :count).by(-2)
        end

        it 'タスク自体は削除されない' do
          delete "/api/v1/milestones/#{milestone_with_tasks.id}", headers: auth_headers
          expect(response).to have_http_status(:no_content)
          expect(Task.active.find_by(id: task1.id)).to be_present
          expect(Task.active.find_by(id: task2.id)).to be_present
        end

        it 'タスクとマイルストーンの関連付けが削除される' do
          delete "/api/v1/milestones/#{milestone_with_tasks.id}", headers: auth_headers
          expect(response).to have_http_status(:no_content)
          expect(MilestoneTask.find_by(milestone_id: milestone_with_tasks.id, task_id: task1.id)).to be_nil
          expect(MilestoneTask.find_by(milestone_id: milestone_with_tasks.id, task_id: task2.id)).to be_nil
        end
      end
    end

    context '異常系' do
      context 'マイルストーンが存在しない場合' do
        it 'returns 404 when milestone does not exist' do
          delete '/api/v1/milestones/99999', headers: auth_headers
          expect(response).to have_http_status(:not_found)

          json_response = JSON.parse(response.body)
          expect(json_response['errors']).to include('マイルストーンが見つかりません')
        end

        it 'does not delete any milestones' do
          expect do
            delete '/api/v1/milestones/99999', headers: auth_headers
          end.not_to change(Milestone, :count)
        end
      end

      context '他のユーザーのマイルストーンを削除しようとした場合' do
        let!(:other_user_milestone) do
          create(:milestone,
                 account_id: 'other-user-id',
                 name: 'Other User Milestone')
        end

        it 'returns 404 when trying to delete another user\'s milestone' do
          delete "/api/v1/milestones/#{other_user_milestone.id}", headers: auth_headers
          expect(response).to have_http_status(:not_found)

          json_response = JSON.parse(response.body)
          expect(json_response['errors']).to include('マイルストーンが見つかりません')
        end

        it 'does not delete the other user\'s milestone' do
          expect do
            delete "/api/v1/milestones/#{other_user_milestone.id}", headers: auth_headers
          end.not_to change(Milestone, :count)

          # マイルストーンがまだ存在することを確認
          expect(Milestone.find_by(id: other_user_milestone.id)).not_to be_nil
        end
      end

      context '認証関連' do
        let!(:test_milestone) do
          create(:milestone,
                 account_id: user_id,
                 name: 'Test Milestone')
        end

        it '認証が失敗した場合、適切なエラーを返すこと' do
          allow_any_instance_of(ApplicationController).to receive(:authorize) do |controller|
            controller.render json: { message: 'Invalid token' }, status: :unauthorized
          end

          delete "/api/v1/milestones/#{test_milestone.id}", headers: auth_headers

          expect(response).to have_http_status(:unauthorized)
          expect(JSON.parse(response.body)['message']).to eq('Invalid token')
        end

        it '認証が失敗した場合、マイルストーンを削除しないこと' do
          allow_any_instance_of(ApplicationController).to receive(:authorize) do |controller|
            controller.render json: { message: 'Invalid token' }, status: :unauthorized
          end

          expect do
            delete "/api/v1/milestones/#{test_milestone.id}", headers: auth_headers
          end.not_to change(Milestone, :count)
        end
      end

      context '権限関連' do
        let!(:test_milestone) do
          create(:milestone,
                 account_id: user_id,
                 name: 'Test Milestone')
        end

        it '権限が不足している場合、403エラーを返すこと' do
          allow_any_instance_of(ApplicationController).to receive(:validate_permissions) do |controller|
            controller.render json: { message: 'Permission denied' }, status: :forbidden
          end

          delete "/api/v1/milestones/#{test_milestone.id}", headers: auth_headers

          expect(response).to have_http_status(:forbidden)
          expect(JSON.parse(response.body)['message']).to eq('Permission denied')
        end

        it '権限が不足している場合、マイルストーンを削除しないこと' do
          allow_any_instance_of(ApplicationController).to receive(:validate_permissions) do |controller|
            controller.render json: { message: 'Permission denied' }, status: :forbidden
          end

          expect do
            delete "/api/v1/milestones/#{test_milestone.id}", headers: auth_headers
          end.not_to change(Milestone, :count)
        end
      end
    end

    context 'エッジケース' do
      it '複数回削除を試みても、2回目は404を返す' do
        # 1回目の削除
        delete "/api/v1/milestones/#{milestone.id}", headers: auth_headers
        expect(response).to have_http_status(:no_content)

        # 2回目の削除
        delete "/api/v1/milestones/#{milestone.id}", headers: auth_headers
        expect(response).to have_http_status(:not_found)
      end

      it '異なるユーザーのマイルストーンが混在している場合、自分のマイルストーンのみ削除できる' do
        other_user_milestone = create(:milestone, account_id: 'other-user', name: 'Other Milestone')

        expect do
          delete "/api/v1/milestones/#{milestone.id}", headers: auth_headers
        end.to change(Milestone, :count).by(-1)

        # 他ユーザーのマイルストーンは残っている
        expect(Milestone.find_by(id: other_user_milestone.id)).not_to be_nil
      end
    end
  end
end
