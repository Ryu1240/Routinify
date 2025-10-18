require 'rails_helper'
require_relative 'shared_context'

RSpec.describe 'POST /api/v1/tasks/bulk_create', type: :request do
  include_context 'tasks request spec setup'

  let(:valid_tasks_params) do
    {
      tasks: [
        {
          title: 'バッチタスク1',
          status: '未着手',
          priority: 'medium'
        },
        {
          title: 'バッチタスク2',
          status: '進行中',
          priority: 'high'
        }
      ]
    }
  end

  describe 'POST /api/v1/tasks/bulk_create' do
    context '正常系' do
      it '複数のタスクを作成できる' do
        post '/api/v1/tasks/bulk_create', params: valid_tasks_params, headers: auth_headers
        
        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        expect(json_response['success']).to be true
        expect(json_response['data'].count).to eq(2)
        expect(json_response['message']).to eq('2件のタスクを作成しました')
      end

      it '作成されたタスクの情報が返される' do
        post '/api/v1/tasks/bulk_create', params: valid_tasks_params, headers: auth_headers
        
        json_response = JSON.parse(response.body)
        expect(json_response['data'].first).to include(
          'title' => 'バッチタスク1',
          'status' => '未着手',
          'priority' => 'medium'
        )
      end
    end

    context '異常系' do
      it '一部のタスクの作成に失敗した場合、エラーを返す' do
        invalid_tasks_params = {
          tasks: [
            { title: 'バッチタスク1', status: '未着手' },
            { title: '', status: '進行中' } # 無効なデータ
          ]
        }

        post '/api/v1/tasks/bulk_create', params: invalid_tasks_params, headers: auth_headers
        
        expect(response).to have_http_status(:unprocessable_entity)
        json_response = JSON.parse(response.body)
        expect(json_response['success']).to be false
        expect(json_response['errors']).to be_present
        expect(json_response['message']).to eq('一部のタスクの作成に失敗しました')
      end

      it 'パラメータが不正な場合、エラーを返す' do
        post '/api/v1/tasks/bulk_create', params: { tasks: [] }, headers: auth_headers
        
        expect(response).to have_http_status(:internal_server_error)
      end
    end
  end
end
