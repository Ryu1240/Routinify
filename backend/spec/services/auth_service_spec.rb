# frozen_string_literal: true

require 'rails_helper'

RSpec.describe AuthService do
  describe '.authenticate' do
    let(:auth0_token) { 'valid_auth0_token' }
    let(:user_id) { 'auth0|user123' }
    let(:email) { 'test@example.com' }
    let(:roles) { [ 'admin', 'user' ] }

    let(:auth0_decoded_token) do
      [
        {
          'sub' => user_id,
          'email' => email
        },
        {
          'alg' => 'RS256'
        }
      ]
    end

    context '正常系' do
      before do
        token_object = Auth0Client::Token.new(auth0_decoded_token)
        auth0_response = Auth0Client::Response.new(token_object, nil)

        allow(Auth0Client).to receive(:validate_token)
          .with(auth0_token)
          .and_return(auth0_response)

        allow(Auth0ManagementClient).to receive(:get_user_roles)
          .with(user_id)
          .and_return(roles)
      end

      it '認証に成功してユーザー情報とロール情報を返す' do
        result = AuthService.authenticate(auth0_token)

        expect(result[:success]).to be true
        expect(result[:data][:user][:id]).to eq(user_id)
        expect(result[:data][:user][:email]).to eq(email)
        expect(result[:data][:user][:roles]).to eq(roles)
      end

      it 'カスタムJWTは返さない' do
        result = AuthService.authenticate(auth0_token)

        expect(result[:data]).not_to have_key(:token)
      end
    end

    context '正常系: emailがカスタムクレームにある場合' do
      let(:email) { nil }
      let(:custom_email) { 'custom@example.com' }

      let(:auth0_decoded_token) do
        [
          {
            'sub' => user_id,
            'https://routinify.com/email' => custom_email
          },
          {
            'alg' => 'RS256'
          }
        ]
      end

      before do
        token_object = Auth0Client::Token.new(auth0_decoded_token)
        auth0_response = Auth0Client::Response.new(token_object, nil)

        allow(Auth0Client).to receive(:validate_token)
          .with(auth0_token)
          .and_return(auth0_response)

        allow(Auth0ManagementClient).to receive(:get_user_roles)
          .with(user_id)
          .and_return(roles)
      end

      it 'カスタムクレームからemailを取得する' do
        result = AuthService.authenticate(auth0_token)

        expect(result[:success]).to be true
        expect(result[:data][:user][:email]).to eq(custom_email)
      end
    end

    context '異常系: Auth0トークン検証失敗' do
      before do
        error = Auth0Client::Error.new('Bad credentials', :unauthorized)
        auth0_response = Auth0Client::Response.new(nil, error)

        allow(Auth0Client).to receive(:validate_token)
          .with(auth0_token)
          .and_return(auth0_response)
      end

      it '認証失敗のレスポンスを返す' do
        result = AuthService.authenticate(auth0_token)

        expect(result[:success]).to be false
        expect(result[:error]).to eq('Invalid Auth0 token')
        expect(result[:status]).to eq(:unauthorized)
      end
    end

    context '異常系: ロール取得失敗' do
      before do
        token_object = Auth0Client::Token.new(auth0_decoded_token)
        auth0_response = Auth0Client::Response.new(token_object, nil)

        allow(Auth0Client).to receive(:validate_token)
          .with(auth0_token)
          .and_return(auth0_response)

        allow(Auth0ManagementClient).to receive(:get_user_roles)
          .with(user_id)
          .and_raise(StandardError, 'API error')
      end

      it '空配列のロールでレスポンスを返す（フォールバック）' do
        result = AuthService.authenticate(auth0_token)

        expect(result[:success]).to be true
        expect(result[:data][:user][:roles]).to eq([])
      end
    end

    context '異常系: 予期しないエラー' do
      before do
        allow(Auth0Client).to receive(:validate_token)
          .with(auth0_token)
          .and_raise(StandardError, 'Unexpected error')
      end

      it '認証失敗のレスポンスを返す' do
        result = AuthService.authenticate(auth0_token)

        expect(result[:success]).to be false
        expect(result[:error]).to eq('Authentication failed')
        expect(result[:status]).to eq(:internal_server_error)
      end
    end
  end
end
