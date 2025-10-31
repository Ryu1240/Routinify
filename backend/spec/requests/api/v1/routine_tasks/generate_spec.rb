require 'rails_helper'
require_relative 'shared_context'

RSpec.describe 'POST /api/v1/routine_tasks/:id/generate', type: :request do
  include_context 'routine_tasks request spec setup'

  let(:redis) { Redis.new(url: ENV.fetch('REDIS_URL', 'redis://redis:6379/0')) }
  let(:routine_task) { create(:routine_task, account_id: user_id) }

  before do
    redis.flushdb
  end

  after do
    redis.close
  end

  describe 'POST /api/v1/routine_tasks/:id/generate' do
    context '正常系' do
      it 'returns 202 Accepted' do
        post "/api/v1/routine_tasks/#{routine_task.id}/generate", headers: auth_headers
        expect(response).to have_http_status(:accepted)
      end

      it 'ジョブIDを含むレスポンスを返すこと' do
        post "/api/v1/routine_tasks/#{routine_task.id}/generate", headers: auth_headers

        json_response = JSON.parse(response.body)
        expect(json_response['success']).to be true
        expect(json_response['data']).to have_key('jobId')
        expect(json_response['data'].keys).to eq([ 'jobId' ])
      end

      it 'Redisにジョブステータスを保存すること' do
        post "/api/v1/routine_tasks/#{routine_task.id}/generate", headers: auth_headers

        json_response = JSON.parse(response.body)
        job_id = json_response['data']['jobId']

        job_status_json = redis.get("job_status:#{job_id}")
        expect(job_status_json).not_to be_nil

        job_status = JSON.parse(job_status_json, symbolize_names: true)
        expect(job_status[:jobId]).to eq(job_id)
        expect(job_status[:status]).to eq('pending')
        expect(job_status[:completed]).to be false
      end

      it 'ジョブステータスにpendingが設定されること' do
        post "/api/v1/routine_tasks/#{routine_task.id}/generate", headers: auth_headers

        json_response = JSON.parse(response.body)
        job_id = json_response['data']['jobId']

        job_status_json = redis.get("job_status:#{job_id}")
        job_status = JSON.parse(job_status_json, symbolize_names: true)

        # Redisには完全な情報が保存される
        expect(job_status[:status]).to eq('pending')
        expect(job_status[:completed]).to be false
      end
    end

    context '異常系' do
      it '存在しないroutine_taskの場合、404エラーを返すこと' do
        post '/api/v1/routine_tasks/999999/generate', headers: auth_headers

        expect(response).to have_http_status(:not_found)
        json_response = JSON.parse(response.body)
        expect(json_response['success']).to be false
      end

      it '他のユーザーのroutine_taskにアクセスできないこと' do
        other_user_task = create(:routine_task, account_id: 'other-user-id')

        post "/api/v1/routine_tasks/#{other_user_task.id}/generate", headers: auth_headers

        expect(response).to have_http_status(:not_found)
        json_response = JSON.parse(response.body)
        expect(json_response['success']).to be false
      end

      context '認証関連' do
        it '認証が失敗した場合、適切なエラーを返すこと' do
          allow_any_instance_of(ApplicationController).to receive(:authorize) do |controller|
            controller.render json: { message: 'Invalid token' }, status: :unauthorized
          end

          post "/api/v1/routine_tasks/#{routine_task.id}/generate", headers: auth_headers

          expect(response).to have_http_status(:unauthorized)
          expect(JSON.parse(response.body)['message']).to eq('Invalid token')
        end
      end

      context '権限関連' do
        it '権限が不足している場合、403エラーを返すこと' do
          allow_any_instance_of(ApplicationController).to receive(:validate_permissions) do |controller|
            controller.render json: { message: 'Permission denied' }, status: :forbidden
          end

          post "/api/v1/routine_tasks/#{routine_task.id}/generate", headers: auth_headers

          expect(response).to have_http_status(:forbidden)
          expect(JSON.parse(response.body)['message']).to eq('Permission denied')
        end
      end
    end

    context 'エッジケース' do
      it '同じroutine_taskに対して複数回リクエストしても、それぞれ異なるジョブIDを返すこと' do
        post "/api/v1/routine_tasks/#{routine_task.id}/generate", headers: auth_headers
        first_job_id = JSON.parse(response.body)['data']['jobId']

        post "/api/v1/routine_tasks/#{routine_task.id}/generate", headers: auth_headers
        second_job_id = JSON.parse(response.body)['data']['jobId']

        expect(first_job_id).not_to eq(second_job_id)
      end

      it 'ジョブIDがUUID形式であること' do
        post "/api/v1/routine_tasks/#{routine_task.id}/generate", headers: auth_headers

        json_response = JSON.parse(response.body)
        job_id = json_response['data']['jobId']

        # UUID v4形式の正規表現
        uuid_regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        expect(job_id).to match(uuid_regex)
      end

      it 'Redisのキーに24時間のTTLが設定されていること' do
        post "/api/v1/routine_tasks/#{routine_task.id}/generate", headers: auth_headers

        json_response = JSON.parse(response.body)
        job_id = json_response['data']['jobId']

        ttl = redis.ttl("job_status:#{job_id}")
        expect(ttl).to be_within(10).of(24.hours.to_i)
      end
    end
  end
end
