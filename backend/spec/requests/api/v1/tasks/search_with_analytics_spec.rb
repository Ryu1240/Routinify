require 'rails_helper'
require_relative 'shared_context'

RSpec.describe 'GET /api/v1/tasks/search_with_analytics', type: :request do
  include_context 'tasks request spec setup'

  let!(:task1) { create(:task, account_id: user_id, title: 'テストタスク1', status: '未着手', priority: 'high') }
  let!(:task2) { create(:task, account_id: user_id, title: 'サンプルタスク2', status: '完了', priority: 'medium') }
  let!(:task3) { create(:task, account_id: user_id, title: 'テスト用タスク3', status: '未着手', priority: 'low') }

  describe 'GET /api/v1/tasks/search_with_analytics' do
    context '正常系' do
      it '検索結果と分析データを返す' do
        get '/api/v1/tasks/search_with_analytics', params: { q: 'テスト' }, headers: auth_headers
        
        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        expect(json_response['success']).to be true
        expect(json_response['data']['tasks']).to be_an(Array)
        expect(json_response['data']['tasks'].count).to eq(2)
        expect(json_response['data']['analytics']).to include(
          'total_count' => 2,
          'by_status' => { '未着手' => 2 },
          'by_priority' => { 'high' => 1, 'low' => 1 },
          'overdue_count' => 0
        )
      end

      it 'フィルタリングが動作する' do
        get '/api/v1/tasks/search_with_analytics', params: { status: '未着手' }, headers: auth_headers
        
        json_response = JSON.parse(response.body)
        expect(json_response['data']['tasks'].count).to eq(2)
        expect(json_response['data']['analytics']['by_status']).to eq({ '未着手' => 2 })
      end

      it '検索クエリがない場合も動作する' do
        get '/api/v1/tasks/search_with_analytics', headers: auth_headers
        
        json_response = JSON.parse(response.body)
        expect(json_response['data']['tasks'].count).to eq(3)
        expect(json_response['data']['analytics']['total_count']).to eq(3)
      end
    end

    context '認証エラー' do
      it '認証されていない場合は403を返す' do
        get '/api/v1/tasks/search_with_analytics', params: { q: 'テスト' }
        
        expect(response).to have_http_status(:forbidden)
      end
    end
  end
end
