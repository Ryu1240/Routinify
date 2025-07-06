require 'rails_helper'

RSpec.describe Api::V1::TasksController, type: :controller do
  before do
    # 認証をスキップ
    allow_any_instance_of(ApplicationController).to receive(:authorize).and_return(true)
    
    # ダミーのトークンを作成
    @dummy_token = double('token')
    allow(@dummy_token).to receive(:validate_permissions).and_return(true)
    allow(@dummy_token).to receive(:token).and_return([
      {
        'scope' => 'read:tasks',
        'sub' => 'test-user-id'
      }
    ])
    
    # @decoded_tokenを設定
    controller.instance_variable_set(:@decoded_token, @dummy_token)
  end

  describe 'GET #index' do
    it 'returns a successful response' do
      get :index
      expect(response).to have_http_status(:ok)
    end

    it 'returns the expected JSON structure' do
      get :index
      json_response = JSON.parse(response.body)
      expect(json_response).to include(
        'message' => 'タスク一覧を取得するエンドポイント',
        'permissions' => ['read:tasks']
      )
    end
  end
end 