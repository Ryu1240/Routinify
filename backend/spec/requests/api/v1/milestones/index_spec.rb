require 'rails_helper'
require_relative 'shared_context'

RSpec.describe 'GET /api/v1/milestones', type: :request do
  include_context 'milestones request spec setup'

  describe 'GET /api/v1/milestones' do
    context '正常系' do
      before do
        create_list(:milestone, 3, account_id: user_id)
      end

      it 'returns a successful response' do
        get '/api/v1/milestones', headers: auth_headers
        expect(response).to have_http_status(:ok)
      end

      it 'returns the expected JSON structure' do
        get '/api/v1/milestones', headers: auth_headers
        json_response = JSON.parse(response.body)
        expect(json_response['data']).to be_an(Array)
        expect(json_response['data'].length).to eq(3)
      end

      it 'returns milestones for the authenticated user only' do
        other_user_milestone = create(:milestone, account_id: 'other-user')
        get '/api/v1/milestones', headers: auth_headers

        json_response = JSON.parse(response.body)
        milestone_ids = json_response['data'].map { |milestone| milestone['id'] }

        expect(milestone_ids).to include(*Milestone.where(account_id: user_id).pluck(:id))
        expect(milestone_ids).not_to include(other_user_milestone.id)
      end

      it 'returns correct milestone attributes' do
        milestone = create(:milestone, account_id: user_id, name: 'Test Milestone', status: 'planning')
        get '/api/v1/milestones', headers: auth_headers

        json_response = JSON.parse(response.body)
        returned_milestone = json_response['data'].find { |m| m['id'] == milestone.id }

        expect(returned_milestone).to include(
          'id' => milestone.id,
          'accountId' => milestone.account_id,
          'name' => milestone.name,
          'status' => milestone.status
        )
        expect(returned_milestone['progressPercentage']).to eq(0)
        expect(returned_milestone['totalTasksCount']).to eq(0)
        expect(returned_milestone['completedTasksCount']).to eq(0)
        expect(returned_milestone['createdAt']).to eq(milestone.created_at.iso8601(3))
        expect(returned_milestone['updatedAt']).to eq(milestone.updated_at.iso8601(3))
      end

      it 'includes progress percentage and task counts when milestone has tasks' do
        milestone = create(:milestone, account_id: user_id, name: 'Milestone with Tasks')
        task1 = create(:task, account_id: user_id, status: 'completed')
        task2 = create(:task, account_id: user_id, status: 'pending')
        create(:milestone_task, milestone: milestone, task: task1)
        create(:milestone_task, milestone: milestone, task: task2)

        get '/api/v1/milestones', headers: auth_headers

        json_response = JSON.parse(response.body)
        returned_milestone = json_response['data'].find { |m| m['id'] == milestone.id }

        expect(returned_milestone['totalTasksCount']).to eq(2)
        expect(returned_milestone['completedTasksCount']).to eq(1)
        expect(returned_milestone['progressPercentage']).to eq(50)
      end
    end

    context 'フィルタリング機能' do
      before do
        create(:milestone, account_id: user_id, status: 'planning', name: 'Planning Milestone')
        create(:milestone, account_id: user_id, status: 'in_progress', name: 'In Progress Milestone')
        create(:milestone, account_id: user_id, status: 'completed', name: 'Completed Milestone')
      end

      it 'ステータスでフィルタリングできること' do
        get '/api/v1/milestones', params: { status: 'planning' }, headers: auth_headers

        json_response = JSON.parse(response.body)
        expect(json_response['data'].length).to eq(1)
        expect(json_response['data'].first['status']).to eq('planning')
      end

      it '名前で検索できること' do
        get '/api/v1/milestones', params: { q: 'Planning' }, headers: auth_headers

        json_response = JSON.parse(response.body)
        expect(json_response['data'].length).to eq(1)
        expect(json_response['data'].first['name']).to eq('Planning Milestone')
      end

      it '期限範囲でフィルタリングできること' do
        overdue_milestone = create(:milestone, account_id: user_id, due_date: Date.current - 1.day)
        today_milestone = create(:milestone, account_id: user_id, due_date: Date.current)
        future_milestone = create(:milestone, account_id: user_id, due_date: Date.current + 1.day)

        get '/api/v1/milestones', params: { due_date_range: 'overdue' }, headers: auth_headers

        json_response = JSON.parse(response.body)
        milestone_ids = json_response['data'].map { |m| m['id'] }
        expect(milestone_ids).to include(overdue_milestone.id)
        expect(milestone_ids).not_to include(today_milestone.id)
        expect(milestone_ids).not_to include(future_milestone.id)
      end
    end

    context 'ソート機能' do
      before do
        @milestone1 = create(:milestone, account_id: user_id, name: 'First', created_at: 3.days.ago)
        @milestone2 = create(:milestone, account_id: user_id, name: 'Second', created_at: 2.days.ago)
        @milestone3 = create(:milestone, account_id: user_id, name: 'Third', created_at: 1.day.ago)
      end

      it '作成日でソートできること（デフォルト: desc）' do
        get '/api/v1/milestones', headers: auth_headers

        json_response = JSON.parse(response.body)
        milestone_names = json_response['data'].map { |m| m['name'] }
        expect(milestone_names).to eq([ 'Third', 'Second', 'First' ])
      end

      it '作成日で昇順ソートできること' do
        get '/api/v1/milestones', params: { sort_by: 'created_at', sort_order: 'asc' }, headers: auth_headers

        json_response = JSON.parse(response.body)
        milestone_names = json_response['data'].map { |m| m['name'] }
        expect(milestone_names).to eq([ 'First', 'Second', 'Third' ])
      end

      it '期限日でソートできること' do
        milestone_due_today = create(:milestone, account_id: user_id, due_date: Date.current)
        milestone_due_tomorrow = create(:milestone, account_id: user_id, due_date: Date.current + 1.day)
        milestone_due_yesterday = create(:milestone, account_id: user_id, due_date: Date.current - 1.day)

        get '/api/v1/milestones', params: { sort_by: 'due_date', sort_order: 'asc' }, headers: auth_headers

        json_response = JSON.parse(response.body)
        milestone_ids = json_response['data'].select { |m| [ milestone_due_yesterday.id, milestone_due_today.id, milestone_due_tomorrow.id ].include?(m['id']) }
        expect(milestone_ids.map { |m| m['id'] }).to eq([ milestone_due_yesterday.id, milestone_due_today.id, milestone_due_tomorrow.id ])
      end
    end

    context '異常系' do
      context '認証関連' do
        it '認証が失敗した場合、適切なエラーを返すこと' do
          allow_any_instance_of(ApplicationController).to receive(:authorize) do |controller|
            controller.render json: { message: 'Invalid token' }, status: :unauthorized
          end

          get '/api/v1/milestones', headers: auth_headers

          expect(response).to have_http_status(:unauthorized)
          expect(JSON.parse(response.body)['message']).to eq('Invalid token')
        end
      end

      context '権限関連' do
        it '権限が不足している場合、403エラーを返すこと' do
          allow_any_instance_of(ApplicationController).to receive(:validate_permissions) do |controller|
            controller.render json: { message: 'Permission denied' }, status: :forbidden
          end

          get '/api/v1/milestones', headers: auth_headers

          expect(response).to have_http_status(:forbidden)
          expect(JSON.parse(response.body)['message']).to eq('Permission denied')
        end
      end

      context 'データベースエラー' do
        it 'データベースエラーが発生した場合、500エラーを返すこと' do
          allow(Milestone).to receive(:for_user).and_raise(ActiveRecord::StatementInvalid, 'Database error')

          get '/api/v1/milestones', headers: auth_headers

          expect(response).to have_http_status(:internal_server_error)
        end
      end
    end

    context 'エッジケース' do
      it 'マイルストーンが存在しない場合、空の配列を返すこと' do
        get '/api/v1/milestones', headers: auth_headers

        json_response = JSON.parse(response.body)
        expect(json_response['data']).to eq([])
      end

      it '大量のマイルストーンがある場合でも正常に動作すること' do
        create_list(:milestone, 100, account_id: user_id)

        get '/api/v1/milestones', headers: auth_headers

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        expect(json_response['data'].length).to eq(100)
      end
    end
  end
end
