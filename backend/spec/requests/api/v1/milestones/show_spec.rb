require 'rails_helper'
require_relative 'shared_context'

RSpec.describe 'GET /api/v1/milestones/:id', type: :request do
  include_context 'milestones request spec setup'

  let(:milestone) do
    create(:milestone,
           account_id: user_id,
           name: 'Test Milestone',
           description: 'Test Description',
           start_date: Date.current + 1.week,
           due_date: Date.current + 2.weeks,
           status: 'planning')
  end

  let(:task1) do
    create(:task,
           account_id: user_id,
           title: 'Task 1',
           status: 'pending',
           priority: 'medium')
  end

  let(:task2) do
    create(:task,
           account_id: user_id,
           title: 'Task 2',
           status: 'completed',
           priority: 'high')
  end

  describe 'GET /api/v1/milestones/:id' do
    context '正常系' do
      before do
        milestone.tasks << task1
        milestone.tasks << task2
      end

      it 'returns a successful response with 200 status' do
        get "/api/v1/milestones/#{milestone.id}", headers: auth_headers
        expect(response).to have_http_status(:ok)
      end

      it 'returns the milestone data' do
        get "/api/v1/milestones/#{milestone.id}", headers: auth_headers

        json_response = JSON.parse(response.body)
        expect(json_response).to include(
          'success' => true,
          'data' => be_present
        )
        expect(json_response['data']).to include(
          'id' => milestone.id,
          'accountId' => user_id,
          'name' => 'Test Milestone',
          'description' => 'Test Description',
          'status' => 'planning'
        )
      end

      it 'includes related tasks in the response' do
        get "/api/v1/milestones/#{milestone.id}", headers: auth_headers

        json_response = JSON.parse(response.body)
        expect(json_response['data']).to have_key('tasks')
        expect(json_response['data']['tasks']).to be_an(Array)
        expect(json_response['data']['tasks'].length).to eq(2)

        task_ids = json_response['data']['tasks'].map { |task| task['id'] }
        expect(task_ids).to include(task1.id, task2.id)
      end

      it 'includes task details in the response' do
        get "/api/v1/milestones/#{milestone.id}", headers: auth_headers

        json_response = JSON.parse(response.body)
        task = json_response['data']['tasks'].find { |t| t['id'] == task1.id }

        expect(task).to include(
          'id' => task1.id,
          'title' => 'Task 1',
          'status' => 'pending',
          'priority' => 'medium'
        )
      end

      it 'includes progress statistics' do
        get "/api/v1/milestones/#{milestone.id}", headers: auth_headers

        json_response = JSON.parse(response.body)
        expect(json_response['data']).to include(
          'totalTasksCount' => 2,
          'completedTasksCount' => 1,
          'progressPercentage' => 50
        )
      end

      it 'returns empty tasks array when milestone has no tasks' do
        milestone_without_tasks = create(:milestone,
                                         account_id: user_id,
                                         name: 'Empty Milestone',
                                         status: 'planning')

        get "/api/v1/milestones/#{milestone_without_tasks.id}", headers: auth_headers

        json_response = JSON.parse(response.body)
        expect(json_response['data']['tasks']).to eq([])
        expect(json_response['data']).to include(
          'totalTasksCount' => 0,
          'completedTasksCount' => 0,
          'progressPercentage' => 0
        )
      end
    end

    context '異常系' do
      it 'returns 404 when milestone does not exist' do
        get '/api/v1/milestones/99999', headers: auth_headers

        expect(response).to have_http_status(:not_found)
        json_response = JSON.parse(response.body)
        expect(json_response).to include(
          'success' => false,
          'errors' => be_present
        )
      end

      it 'returns 404 when milestone belongs to different user' do
        other_user_milestone = create(:milestone,
                                      account_id: 'other-user-id',
                                      name: 'Other User Milestone',
                                      status: 'planning')

        get "/api/v1/milestones/#{other_user_milestone.id}", headers: auth_headers

        expect(response).to have_http_status(:not_found)
      end

      context '認証関連' do
        it '認証が失敗した場合、適切なエラーを返すこと' do
          allow_any_instance_of(ApplicationController).to receive(:authorize) do |controller|
            controller.render json: { message: 'Invalid token' }, status: :unauthorized
          end

          get "/api/v1/milestones/#{milestone.id}", headers: auth_headers

          expect(response).to have_http_status(:unauthorized)
        end
      end

      context '権限関連' do
        it '権限が不足している場合、403エラーを返すこと' do
          allow_any_instance_of(ApplicationController).to receive(:validate_permissions) do |controller|
            controller.render json: { message: 'Permission denied' }, status: :forbidden
          end

          get "/api/v1/milestones/#{milestone.id}", headers: auth_headers

          expect(response).to have_http_status(:forbidden)
          expect(JSON.parse(response.body)['message']).to eq('Permission denied')
        end
      end
    end
  end
end

