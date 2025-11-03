# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Api::V1::AuthController, type: :controller do
  describe 'POST #login' do
    let(:auth0_token) { 'valid_auth0_token' }
    let(:user_data) do
      {
        id: 'auth0|user123',
        email: 'test@example.com',
        roles: [ 'admin' ]
      }
    end

    context '正常系' do
      before do
        allow(AuthService).to receive(:authenticate).with(auth0_token).and_return(
          success: true,
          data: { user: user_data }
        )
      end

      it 'ユーザー情報とロール情報を返す' do
        post :login, params: { auth0_token: auth0_token }

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json['success']).to be true
        expect(json['data']['user']['id']).to eq('auth0|user123')
        expect(json['data']['user']['email']).to eq('test@example.com')
        expect(json['data']['user']['roles']).to eq([ 'admin' ])
      end

      it 'カスタムJWTは返さない' do
        post :login, params: { auth0_token: auth0_token }

        json = JSON.parse(response.body)
        expect(json['data']).not_to have_key('token')
        expect(json['data']['user']).not_to have_key('token')
      end
    end

    context '異常系: auth0_tokenが空' do
      it '400エラーを返す' do
        post :login, params: { auth0_token: '' }

        expect(response).to have_http_status(:bad_request)
        json = JSON.parse(response.body)
        expect(json['success']).to be false
        expect(json['errors']).to include('auth0_token is required')
      end
    end

    context '異常系: auth0_tokenがnil' do
      it '400エラーを返す' do
        post :login, params: { auth0_token: nil }

        expect(response).to have_http_status(:bad_request)
        json = JSON.parse(response.body)
        expect(json['success']).to be false
        expect(json['errors']).to include('auth0_token is required')
      end
    end

    context '異常系: auth0_tokenパラメータがない' do
      it '400エラーを返す' do
        post :login, params: {}

        expect(response).to have_http_status(:bad_request)
        json = JSON.parse(response.body)
        expect(json['success']).to be false
        expect(json['errors']).to include('auth0_token is required')
      end
    end

    context '異常系: 認証失敗' do
      before do
        allow(AuthService).to receive(:authenticate).with(auth0_token).and_return(
          success: false,
          error: 'Invalid Auth0 token'
        )
      end

      it '401エラーを返す' do
        post :login, params: { auth0_token: auth0_token }

        expect(response).to have_http_status(:unauthorized)
        json = JSON.parse(response.body)
        expect(json['success']).to be false
        expect(json['message']).to eq('Invalid Auth0 token')
        expect(json['errors']).to include('Invalid Auth0 token')
      end
    end

    context '異常系: AuthServiceで例外が発生' do
      before do
        allow(AuthService).to receive(:authenticate).and_raise(StandardError, 'Unexpected error')
      end

      it '500エラーを返す' do
        post :login, params: { auth0_token: auth0_token }

        expect(response).to have_http_status(:internal_server_error)
      end
    end
  end
end
