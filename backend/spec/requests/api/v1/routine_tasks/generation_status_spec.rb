require 'rails_helper'
require_relative 'shared_context'

RSpec.describe 'GET /api/v1/routine_tasks/:id/generation_status', type: :request do
  include_context 'routine_tasks request spec setup'

  let(:redis) { Redis.new(url: ENV.fetch('REDIS_URL', 'redis://redis:6379/0')) }
  let(:routine_task) { create(:routine_task, account_id: user_id) }
  let(:job_id) { SecureRandom.uuid }

  before do
    redis.flushdb
  end

  after do
    redis.close
  end

  describe 'GET /api/v1/routine_tasks/:id/generation_status' do
    context '正常系' do
      it 'pendingステータスを返すこと' do
        job_status = {
          jobId: job_id,
          status: 'pending',
          completed: false,
          createdAt: Time.current.iso8601
        }
        redis.setex("job_status:#{job_id}", 24.hours.to_i, job_status.to_json)

        get "/api/v1/routine_tasks/#{routine_task.id}/generation_status",
            params: { job_id: job_id },
            headers: auth_headers

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        expect(json_response['success']).to be true
        expect(json_response['data']['jobId']).to eq(job_id)
        expect(json_response['data']['status']).to eq('pending')
        expect(json_response['data']['completed']).to be false
      end

      it 'runningステータスを返すこと' do
        job_status = {
          jobId: job_id,
          status: 'running',
          completed: false,
          createdAt: Time.current.iso8601
        }
        redis.setex("job_status:#{job_id}", 24.hours.to_i, job_status.to_json)

        get "/api/v1/routine_tasks/#{routine_task.id}/generation_status",
            params: { job_id: job_id },
            headers: auth_headers

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        expect(json_response['data']['status']).to eq('running')
      end

      it 'completedステータスと生成されたタスク数を返すこと' do
        job_status = {
          jobId: job_id,
          status: 'completed',
          completed: true,
          generatedTasksCount: 3,
          createdAt: 5.minutes.ago.iso8601,
          completedAt: Time.current.iso8601
        }
        redis.setex("job_status:#{job_id}", 24.hours.to_i, job_status.to_json)

        get "/api/v1/routine_tasks/#{routine_task.id}/generation_status",
            params: { job_id: job_id },
            headers: auth_headers

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        expect(json_response['data']['status']).to eq('completed')
        expect(json_response['data']['completed']).to be true
        expect(json_response['data']['generatedTasksCount']).to eq(3)
        expect(json_response['data']).to have_key('completedAt')
      end

      it 'failedステータスとエラーメッセージを返すこと' do
        job_status = {
          jobId: job_id,
          status: 'failed',
          completed: true,
          error: 'タスク生成中にエラーが発生しました',
          createdAt: 5.minutes.ago.iso8601,
          completedAt: Time.current.iso8601
        }
        redis.setex("job_status:#{job_id}", 24.hours.to_i, job_status.to_json)

        get "/api/v1/routine_tasks/#{routine_task.id}/generation_status",
            params: { job_id: job_id },
            headers: auth_headers

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        expect(json_response['data']['status']).to eq('failed')
        expect(json_response['data']['completed']).to be true
        expect(json_response['data']['error']).to eq('タスク生成中にエラーが発生しました')
      end
    end

    context '異常系' do
      it 'job_idパラメータが欠けている場合、400エラーを返すこと' do
        get "/api/v1/routine_tasks/#{routine_task.id}/generation_status",
            headers: auth_headers

        expect(response).to have_http_status(:bad_request)
        json_response = JSON.parse(response.body)
        expect(json_response['success']).to be false
        expect(json_response['errors']).to include('job_idパラメータが必要です')
      end

      it '存在しないjob_idの場合、404エラーを返すこと' do
        get "/api/v1/routine_tasks/#{routine_task.id}/generation_status",
            params: { job_id: 'non-existent-job-id' },
            headers: auth_headers

        expect(response).to have_http_status(:not_found)
        json_response = JSON.parse(response.body)
        expect(json_response['success']).to be false
        expect(json_response['errors']).to include('指定されたジョブが見つかりません')
      end

      it '存在しないroutine_taskの場合、404エラーを返すこと' do
        job_status = {
          jobId: job_id,
          status: 'completed',
          completed: true,
          createdAt: Time.current.iso8601
        }
        redis.setex("job_status:#{job_id}", 24.hours.to_i, job_status.to_json)

        get '/api/v1/routine_tasks/999999/generation_status',
            params: { job_id: job_id },
            headers: auth_headers

        expect(response).to have_http_status(:not_found)
        json_response = JSON.parse(response.body)
        expect(json_response['success']).to be false
      end

      it '他のユーザーのroutine_taskにアクセスできないこと' do
        other_user_task = create(:routine_task, account_id: 'other-user-id')
        job_status = {
          jobId: job_id,
          status: 'completed',
          completed: true,
          createdAt: Time.current.iso8601
        }
        redis.setex("job_status:#{job_id}", 24.hours.to_i, job_status.to_json)

        get "/api/v1/routine_tasks/#{other_user_task.id}/generation_status",
            params: { job_id: job_id },
            headers: auth_headers

        expect(response).to have_http_status(:not_found)
        json_response = JSON.parse(response.body)
        expect(json_response['success']).to be false
      end

      context '認証関連' do
        it '認証が失敗した場合、適切なエラーを返すこと' do
          allow_any_instance_of(ApplicationController).to receive(:authorize) do |controller|
            controller.render json: { message: 'Invalid token' }, status: :unauthorized
          end

          get "/api/v1/routine_tasks/#{routine_task.id}/generation_status",
              params: { job_id: job_id },
              headers: auth_headers

          expect(response).to have_http_status(:unauthorized)
          expect(JSON.parse(response.body)['message']).to eq('Invalid token')
        end
      end

      context '権限関連' do
        it '権限が不足している場合、403エラーを返すこと' do
          allow_any_instance_of(ApplicationController).to receive(:validate_permissions) do |controller|
            controller.render json: { message: 'Permission denied' }, status: :forbidden
          end

          get "/api/v1/routine_tasks/#{routine_task.id}/generation_status",
              params: { job_id: job_id },
              headers: auth_headers

          expect(response).to have_http_status(:forbidden)
          expect(JSON.parse(response.body)['message']).to eq('Permission denied')
        end
      end
    end

    context 'エッジケース' do
      it 'job_idが空文字の場合、400エラーを返すこと' do
        get "/api/v1/routine_tasks/#{routine_task.id}/generation_status",
            params: { job_id: '' },
            headers: auth_headers

        expect(response).to have_http_status(:bad_request)
        json_response = JSON.parse(response.body)
        expect(json_response['errors']).to include('job_idパラメータが必要です')
      end

      it '期限切れのジョブ（Redisから削除済み）の場合、404エラーを返すこと' do
        # Redisにデータを保存しない（期限切れを模擬）
        get "/api/v1/routine_tasks/#{routine_task.id}/generation_status",
            params: { job_id: job_id },
            headers: auth_headers

        expect(response).to have_http_status(:not_found)
        json_response = JSON.parse(response.body)
        expect(json_response['errors']).to include('指定されたジョブが見つかりません')
      end

      it 'ジョブステータスがJSON形式で正しく返されること' do
        created_at = 10.minutes.ago
        completed_at = 5.minutes.ago

        job_status = {
          jobId: job_id,
          status: 'completed',
          completed: true,
          generatedTasksCount: 5,
          createdAt: created_at.iso8601,
          completedAt: completed_at.iso8601
        }
        redis.setex("job_status:#{job_id}", 24.hours.to_i, job_status.to_json)

        get "/api/v1/routine_tasks/#{routine_task.id}/generation_status",
            params: { job_id: job_id },
            headers: auth_headers

        json_response = JSON.parse(response.body)
        data = json_response['data']

        expect(data).to include(
          'jobId' => job_id,
          'status' => 'completed',
          'completed' => true,
          'generatedTasksCount' => 5
        )
        expect(data).to have_key('createdAt')
        expect(data).to have_key('completedAt')
      end
    end
  end
end
