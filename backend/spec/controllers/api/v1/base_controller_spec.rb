require 'rails_helper'

RSpec.describe Api::V1::BaseController, type: :controller do
  controller(Api::V1::BaseController) do
    def test_success
      render_success(data: { test: 'data' }, message: 'テスト成功')
    end

    def test_error
      render_error(errors: [ 'テストエラー' ])
    end

    def test_not_found
      render_not_found('テストリソース')
    end

    def test_handle_service_result
      # 実際のServiceResultオブジェクトを作成
      result = BaseService::ServiceResult.new(
        success: true,
        data: { test: 'data' },
        message: 'テスト成功',
        status: 200
      )

      handle_service_result(result)
    end
  end

  before do
    # テスト用のルートを追加
    routes.draw do
      namespace :api do
        namespace :v1 do
          get 'test_success', to: 'base#test_success'
          get 'test_error', to: 'base#test_error'
          get 'test_not_found', to: 'base#test_not_found'
          get 'test_handle_service_result', to: 'base#test_handle_service_result'
        end
      end
    end
  end

  before do
    # 認証をスキップ
    allow(controller).to receive(:authorize).and_return(true)
    allow(controller).to receive(:current_user_id).and_return('test-user-id')
  end

  describe '#render_success' do
    it '成功レスポンスを返す' do
      get :test_success

      expect(response).to have_http_status(:ok)
      json_response = JSON.parse(response.body)
      expect(json_response).to include(
        'success' => true,
        'data' => { 'test' => 'data' },
        'message' => 'テスト成功'
      )
    end
  end

  describe '#render_error' do
    it 'エラーレスポンスを返す' do
      get :test_error

      expect(response).to have_http_status(:unprocessable_entity)
      json_response = JSON.parse(response.body)
      expect(json_response).to include(
        'success' => false,
        'errors' => [ 'テストエラー' ]
      )
    end
  end

  describe '#render_not_found' do
    it '404レスポンスを返す' do
      get :test_not_found

      expect(response).to have_http_status(:not_found)
      json_response = JSON.parse(response.body)
      expect(json_response).to include(
        'success' => false,
        'errors' => [ 'テストリソースが見つかりません' ]
      )
    end
  end

  describe '#handle_service_result' do
    it 'サービス結果を適切に処理する' do
      # テスト用のルートを使用してHTTPリクエストを送信
      get :test_handle_service_result

      expect(response).to have_http_status(:ok)
      json_response = JSON.parse(response.body)
      expect(json_response).to include(
        'success' => true,
        'data' => { 'test' => 'data' },
        'message' => 'テスト成功'
      )
    end
  end
end
