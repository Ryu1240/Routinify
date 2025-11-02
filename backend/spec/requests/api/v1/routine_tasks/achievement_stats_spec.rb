require 'rails_helper'
require_relative 'shared_context'

RSpec.describe 'GET /api/v1/routine_tasks/:id/achievement_stats', type: :request do
  include_context 'routine_tasks request spec setup'

  let(:category) { create(:category, account_id: user_id, name: '仕事') }
  let!(:routine_task) do
    create(:routine_task,
           account_id: user_id,
           title: 'Test Routine Task',
           frequency: 'daily',
           priority: 'high',
           category_id: category.id)
  end

  describe 'GET /api/v1/routine_tasks/:id/achievement_stats' do
    context '正常系' do
      context '週次の達成状況取得' do
        let(:week_start) { Date.current.beginning_of_week }
        let(:week_end) { Date.current.end_of_week }

        before do
          # 完了したタスクを3つ作成
          create_list(:task, 3,
                     account_id: user_id,
                     routine_task: routine_task,
                     generated_at: week_start + 1.day,
                     status: 'completed')
          # 未完了のタスクを2つ作成
          create_list(:task, 2,
                     account_id: user_id,
                     routine_task: routine_task,
                     generated_at: week_start + 2.days,
                     status: 'pending')
        end

        it 'returns a successful response with 200 status' do
          get "/api/v1/routine_tasks/#{routine_task.id}/achievement_stats", headers: auth_headers
          expect(response).to have_http_status(:ok)
        end

        it 'returns the correct achievement stats data' do
          get "/api/v1/routine_tasks/#{routine_task.id}/achievement_stats", headers: auth_headers
          json_response = JSON.parse(response.body)

          expect(json_response['success']).to be true
          expect(json_response['data']).to be_a(Hash)
          expect(json_response['data']).to include(
            'total_count',
            'completed_count',
            'incomplete_count',
            'overdue_count',
            'achievement_rate',
            'period',
            'start_date',
            'end_date',
            'consecutive_periods_count',
            'average_completion_days'
          )
          expect(json_response['data']['period']).to eq('weekly')
          expect(json_response['data']['total_count']).to eq(5)
          expect(json_response['data']['completed_count']).to eq(3)
          expect(json_response['data']['incomplete_count']).to eq(2)
        end

        it 'periodパラメータを指定できること' do
          get "/api/v1/routine_tasks/#{routine_task.id}/achievement_stats?period=weekly", headers: auth_headers
          json_response = JSON.parse(response.body)

          expect(json_response['success']).to be true
          expect(json_response['data']['period']).to eq('weekly')
        end
      end

      context '月次の達成状況取得' do
        let(:month_start) { Date.current.beginning_of_month }
        let(:month_end) { Date.current.end_of_month }

        before do
          create_list(:task, 5,
                     account_id: user_id,
                     routine_task: routine_task,
                     generated_at: month_start + 5.days,
                     status: 'completed')
          create_list(:task, 3,
                     account_id: user_id,
                     routine_task: routine_task,
                     generated_at: month_start + 10.days,
                     status: 'pending')
        end

        it 'returns monthly achievement stats' do
          get "/api/v1/routine_tasks/#{routine_task.id}/achievement_stats?period=monthly", headers: auth_headers
          json_response = JSON.parse(response.body)

          expect(json_response['success']).to be true
          expect(json_response['data']['period']).to eq('monthly')
          expect(json_response['data']['total_count']).to eq(8)
          expect(json_response['data']['completed_count']).to eq(5)
          expect(json_response['data']['incomplete_count']).to eq(3)
        end
      end

      context '特定期間の達成状況取得' do
        let(:start_date) { Date.current - 10.days }
        let(:end_date) { Date.current - 5.days }

        before do
          create_list(:task, 4,
                     account_id: user_id,
                     routine_task: routine_task,
                     generated_at: start_date + 2.days,
                     status: 'completed')
          create_list(:task, 2,
                     account_id: user_id,
                     routine_task: routine_task,
                     generated_at: start_date + 3.days,
                     status: 'pending')
        end

        it 'returns custom period achievement stats' do
          get "/api/v1/routine_tasks/#{routine_task.id}/achievement_stats?period=custom&start_date=#{start_date.iso8601}&end_date=#{end_date.iso8601}",
              headers: auth_headers
          json_response = JSON.parse(response.body)

          expect(json_response['success']).to be true
          expect(json_response['data']['period']).to eq('custom')
          expect(json_response['data']['start_date']).to eq(start_date.iso8601)
          expect(json_response['data']['end_date']).to eq(end_date.iso8601)
          expect(json_response['data']['total_count']).to eq(6)
          expect(json_response['data']['completed_count']).to eq(4)
          expect(json_response['data']['incomplete_count']).to eq(2)
        end
      end

      context 'タスクが存在しない場合' do
        it 'returns zero counts' do
          get "/api/v1/routine_tasks/#{routine_task.id}/achievement_stats", headers: auth_headers
          json_response = JSON.parse(response.body)

          expect(json_response['success']).to be true
          expect(json_response['data']['total_count']).to eq(0)
          expect(json_response['data']['completed_count']).to eq(0)
          expect(json_response['data']['achievement_rate']).to eq(0.0)
        end
      end
    end

    context '異常系' do
      context '習慣化タスクが存在しない場合' do
        it 'returns 404 when routine_task does not exist' do
          get '/api/v1/routine_tasks/99999/achievement_stats', headers: auth_headers
          expect(response).to have_http_status(:not_found)

          json_response = JSON.parse(response.body)
          expect(json_response['errors']).to include('習慣化タスクが見つかりません')
        end
      end

      context '他のユーザーの習慣化タスクを取得しようとした場合' do
        let!(:other_user_routine_task) { create(:routine_task, account_id: 'other-user', title: 'Other User Routine Task') }

        it 'returns 404 when trying to access another users routine_task' do
          get "/api/v1/routine_tasks/#{other_user_routine_task.id}/achievement_stats", headers: auth_headers
          expect(response).to have_http_status(:not_found)

          json_response = JSON.parse(response.body)
          expect(json_response['errors']).to include('習慣化タスクが見つかりません')
        end
      end

      context 'パラメータバリデーション' do
        context '無効なperiodパラメータ' do
          it 'returns 400 when period is invalid' do
            get "/api/v1/routine_tasks/#{routine_task.id}/achievement_stats?period=invalid", headers: auth_headers
            expect(response).to have_http_status(:bad_request)

            json_response = JSON.parse(response.body)
            expect(json_response['success']).to be false
            expect(json_response['errors']).to include('periodはweekly、monthly、customのいずれかである必要があります')
          end
        end

        context 'custom期間でstart_dateとend_dateが未指定' do
          it 'returns 400 when start_date and end_date are missing' do
            get "/api/v1/routine_tasks/#{routine_task.id}/achievement_stats?period=custom", headers: auth_headers
            expect(response).to have_http_status(:bad_request)

            json_response = JSON.parse(response.body)
            expect(json_response['success']).to be false
            expect(json_response['errors']).to include('periodがcustomの場合、start_dateとend_dateは必須です')
          end
        end

        context 'custom期間でstart_dateのみ指定' do
          it 'returns 400 when end_date is missing' do
            get "/api/v1/routine_tasks/#{routine_task.id}/achievement_stats?period=custom&start_date=2025-01-01",
                headers: auth_headers
            expect(response).to have_http_status(:bad_request)

            json_response = JSON.parse(response.body)
            expect(json_response['success']).to be false
            expect(json_response['errors']).to include('periodがcustomの場合、start_dateとend_dateは必須です')
          end
        end

        context '無効な日付形式' do
          it 'returns 400 when start_date is invalid' do
            get "/api/v1/routine_tasks/#{routine_task.id}/achievement_stats?period=custom&start_date=invalid&end_date=2025-01-10",
                headers: auth_headers
            expect(response).to have_http_status(:bad_request)

            json_response = JSON.parse(response.body)
            expect(json_response['success']).to be false
            expect(json_response['errors']).to include('start_dateとend_dateは有効な日付形式である必要があります')
          end
        end

        context 'start_dateがend_dateより後' do
          it 'returns 400 when start_date is after end_date' do
            get "/api/v1/routine_tasks/#{routine_task.id}/achievement_stats?period=custom&start_date=2025-01-10&end_date=2025-01-01",
                headers: auth_headers
            expect(response).to have_http_status(:bad_request)

            json_response = JSON.parse(response.body)
            expect(json_response['success']).to be false
            expect(json_response['errors']).to include('start_dateはend_dateより前である必要があります')
          end
        end
      end

      context '認証関連' do
        it '認証が失敗した場合、適切なエラーを返すこと' do
          allow_any_instance_of(ApplicationController).to receive(:authorize) do |controller|
            controller.render json: { message: 'Invalid token' }, status: :unauthorized
          end

          get "/api/v1/routine_tasks/#{routine_task.id}/achievement_stats", headers: auth_headers

          expect(response).to have_http_status(:unauthorized)
          expect(JSON.parse(response.body)['message']).to eq('Invalid token')
        end
      end

      context '権限関連' do
        it '権限が不足している場合、403エラーを返すこと' do
          allow_any_instance_of(ApplicationController).to receive(:validate_permissions) do |controller|
            controller.render json: { message: 'Permission denied' }, status: :forbidden
          end

          get "/api/v1/routine_tasks/#{routine_task.id}/achievement_stats", headers: auth_headers

          expect(response).to have_http_status(:forbidden)
          expect(JSON.parse(response.body)['message']).to eq('Permission denied')
        end
      end
    end
  end
end

