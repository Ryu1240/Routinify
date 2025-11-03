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

    context '異常系: 認証失敗（unauthorized）' do
      before do
        allow(AuthService).to receive(:authenticate).with(auth0_token).and_return(
          success: false,
          error: 'Invalid Auth0 token',
          status: :unauthorized
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

    context '異常系: 認証失敗（internal_server_error）' do
      before do
        allow(AuthService).to receive(:authenticate).with(auth0_token).and_return(
          success: false,
          error: 'Authentication failed',
          status: :internal_server_error
        )
      end

      it '500エラーを返す（Auth0Clientからのエラー、例: JWKS取得失敗）' do
        post :login, params: { auth0_token: auth0_token }

        expect(response).to have_http_status(:internal_server_error)
        json = JSON.parse(response.body)
        expect(json['success']).to be false
        expect(json['message']).to eq('Authentication failed')
        expect(json['errors']).to include('Authentication failed')
      end
    end

    context '異常系: 認証失敗（statusが指定されていない場合のフォールバック）' do
      before do
        allow(AuthService).to receive(:authenticate).with(auth0_token).and_return(
          success: false,
          error: 'Invalid Auth0 token'
        )
      end

      it 'デフォルトで401エラーを返す' do
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

  describe 'POST #logout' do
    let(:user_id) { 'auth0|user123' }
    let(:email) { 'test@example.com' }
    let(:roles) { [ 'admin' ] }

    let(:decoded_token_data) do
      [
        {
          'sub' => user_id,
          'email' => email
        },
        { 'alg' => 'RS256' }
      ]
    end

    context '正常系' do
      before do
        token_object = Auth0Client::Token.new(decoded_token_data)
        allow(controller).to receive(:authorize) do
          controller.instance_variable_set(:@decoded_token, token_object)
        end
      end

      it 'ログアウト成功メッセージを返す' do
        post :logout

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json['success']).to be true
        expect(json['message']).to eq('Logged out successfully')
      end
    end

    context '異常系: 認証なし' do
      before do
        allow(controller).to receive(:authorize).and_call_original
      end

      it '401エラーを返す' do
        post :logout

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe 'GET #me' do
    let(:user_id) { 'auth0|user123' }
    let(:email) { 'test@example.com' }
    let(:roles) { [ 'admin' ] }

    let(:decoded_token_data) do
      [
        {
          'sub' => user_id,
          'email' => email
        },
        { 'alg' => 'RS256' }
      ]
    end

    context '正常系' do
      before do
        token_object = Auth0Client::Token.new(decoded_token_data)
        allow(controller).to receive(:authorize) do
          controller.instance_variable_set(:@decoded_token, token_object)
        end
        allow(Auth0ManagementClient).to receive(:get_user_roles).with(user_id).and_return(roles)
      end

      it 'ユーザー情報を返す' do
        get :me

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json['success']).to be true
        expect(json['data']['user']['id']).to eq(user_id)
        expect(json['data']['user']['email']).to eq(email)
        expect(json['data']['user']['roles']).to eq(roles)
      end
    end

    context '正常系: emailがカスタムクレームにある場合' do
      let(:custom_email) { 'custom@example.com' }

      let(:decoded_token_data) do
        [
          {
            'sub' => user_id,
            'https://routinify.com/email' => custom_email
          },
          { 'alg' => 'RS256' }
        ]
      end

      before do
        token_object = Auth0Client::Token.new(decoded_token_data)
        allow(controller).to receive(:authorize) do
          controller.instance_variable_set(:@decoded_token, token_object)
        end
        allow(Auth0ManagementClient).to receive(:get_user_roles).with(user_id).and_return(roles)
      end

      it 'カスタムクレームからemailを取得する' do
        get :me

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json['data']['user']['email']).to eq(custom_email)
      end
    end

    context '異常系: 認証なし' do
      before do
        allow(controller).to receive(:authorize).and_call_original
      end

      it '401エラーを返す' do
        get :me

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context '異常系: ロール取得失敗' do
      before do
        token_object = Auth0Client::Token.new(decoded_token_data)
        allow(controller).to receive(:authorize) do
          controller.instance_variable_set(:@decoded_token, token_object)
        end
        allow(Auth0ManagementClient).to receive(:get_user_roles).with(user_id).and_return([])
      end

      it '空配列のロールでレスポンスを返す（フォールバック）' do
        get :me

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json['data']['user']['roles']).to eq([])
      end
    end
  end
end
