# frozen_string_literal: true

require 'rails_helper'
require_relative 'shared_context'

RSpec.describe 'GET /api/v1/admin/users', type: :request do
  include_context 'admin users request spec setup'

  describe 'GET /api/v1/admin/users' do
    context '正常系' do
      let(:mock_users_response) do
        {
          'users' => [
            {
              'user_id' => 'auth0|123',
              'name' => 'Test User 1',
              'email' => 'user1@example.com',
              'picture' => 'https://example.com/pic1.jpg',
              'nickname' => 'user1',
              'email_verified' => true,
              'created_at' => '2024-01-01T00:00:00.000Z',
              'updated_at' => '2024-01-02T00:00:00.000Z',
              'last_login' => '2024-01-15T00:00:00.000Z',
              'logins_count' => 10
            },
            {
              'user_id' => 'auth0|456',
              'name' => 'Test User 2',
              'email' => 'user2@example.com',
              'picture' => 'https://example.com/pic2.jpg',
              'nickname' => 'user2',
              'email_verified' => false,
              'created_at' => '2024-01-03T00:00:00.000Z',
              'updated_at' => '2024-01-04T00:00:00.000Z',
              'last_login' => '2024-01-14T00:00:00.000Z',
              'logins_count' => 5
            }
          ],
          'total' => 2,
          'start' => 0,
          'limit' => 50
        }
      end

      before do
        allow(Auth0ManagementClient).to receive(:list_users).and_return(mock_users_response)

        # read:users権限があることをモック
        decoded_token = double('decoded_token')
        allow(decoded_token).to receive(:validate_permissions).with([ 'read:users' ]).and_return(true)
        allow_any_instance_of(ApplicationController).to receive(:authorize) do |controller|
          controller.instance_variable_set(:@decoded_token, decoded_token)
        end
      end

      it 'returns a successful response' do
        get '/api/v1/admin/users', headers: auth_headers
        expect(response).to have_http_status(:ok)
      end

      it 'returns the expected JSON structure' do
        get '/api/v1/admin/users', headers: auth_headers
        json_response = JSON.parse(response.body)
        expect(json_response['success']).to be true
        expect(json_response['data']).to be_a(Hash)
        expect(json_response['data']['users']).to be_an(Array)
        expect(json_response['data']['users'].length).to eq(2)
      end

      it 'returns correct user attributes' do
        get '/api/v1/admin/users', headers: auth_headers
        json_response = JSON.parse(response.body)
        user = json_response['data']['users'].first

        expect(user).to include(
          'sub' => 'auth0|123',
          'name' => 'Test User 1',
          'email' => 'user1@example.com',
          'picture' => 'https://example.com/pic1.jpg',
          'nickname' => 'user1',
          'emailVerified' => true,
          'loginsCount' => 10
        )
      end

      it 'includes pagination information' do
        get '/api/v1/admin/users', headers: auth_headers
        json_response = JSON.parse(response.body)
        data = json_response['data']

        expect(data['total']).to eq(2)
        expect(data['start']).to eq(0)
        expect(data['limit']).to eq(50)
      end

      it 'calls Auth0ManagementClient with correct parameters' do
        get '/api/v1/admin/users', params: { page: 1, per_page: 20, q: 'email:"user@example.com"' }, headers: auth_headers
        expect(Auth0ManagementClient).to have_received(:list_users).with(
          hash_including(
            page: '1',
            per_page: '20',
            q: 'email:"user@example.com"'
          )
        )
      end
    end

    context '異常系' do
      context '認証関連' do
        it '認証が失敗した場合、適切なエラーを返すこと' do
          allow_any_instance_of(ApplicationController).to receive(:authorize) do |controller|
            controller.render json: { message: 'Invalid token' }, status: :unauthorized
          end

          get '/api/v1/admin/users', headers: auth_headers

          expect(response).to have_http_status(:unauthorized)
          expect(JSON.parse(response.body)['message']).to eq('Invalid token')
        end
      end

      context '権限関連' do
        it '権限が不足している場合、403エラーを返すこと' do
          # read:users権限がないことをモック
          decoded_token = double('decoded_token')
          allow(decoded_token).to receive(:validate_permissions).with([ 'read:users' ]).and_return(false)
          allow_any_instance_of(ApplicationController).to receive(:authorize) do |controller|
            controller.instance_variable_set(:@decoded_token, decoded_token)
          end

          get '/api/v1/admin/users', headers: auth_headers

          expect(response).to have_http_status(:forbidden)
          json_response = JSON.parse(response.body)
          expect(json_response['error']).to eq('insufficient_permissions')
          expect(json_response['message']).to eq('Permission denied')
        end
      end

      context 'Auth0 Management API エラー' do
        it 'API呼び出しが失敗した場合、500エラーを返すこと' do
          decoded_token = double('decoded_token')
          allow(decoded_token).to receive(:validate_permissions).with([ 'read:users' ]).and_return(true)
          allow_any_instance_of(ApplicationController).to receive(:authorize) do |controller|
            controller.instance_variable_set(:@decoded_token, decoded_token)
          end

          allow(Auth0ManagementClient).to receive(:list_users).and_raise(StandardError, 'API Error')

          get '/api/v1/admin/users', headers: auth_headers

          expect(response).to have_http_status(:internal_server_error)
          json_response = JSON.parse(response.body)
          expect(json_response['success']).to be false
          expect(json_response['errors']).to include('内部サーバーエラーが発生しました')
        end
      end
    end

    context 'エッジケース' do
      before do
        decoded_token = double('decoded_token')
        allow(decoded_token).to receive(:validate_permissions).with([ 'read:users' ]).and_return(true)
        allow_any_instance_of(ApplicationController).to receive(:authorize) do |controller|
          controller.instance_variable_set(:@decoded_token, decoded_token)
        end
      end

      it 'ユーザーが存在しない場合、空の配列を返すこと' do
        allow(Auth0ManagementClient).to receive(:list_users).and_return(
          {
            'users' => [],
            'total' => 0,
            'start' => 0,
            'limit' => 50
          }
        )

        get '/api/v1/admin/users', headers: auth_headers

        json_response = JSON.parse(response.body)
        expect(json_response['data']['users']).to eq([])
        expect(json_response['data']['total']).to eq(0)
      end

      it 'ページネーションパラメータが指定された場合、正しく処理すること' do
        allow(Auth0ManagementClient).to receive(:list_users).and_return(
          {
            'users' => [],
            'total' => 100,
            'start' => 50,
            'limit' => 50
          }
        )

        get '/api/v1/admin/users', params: { page: 1, per_page: 50 }, headers: auth_headers

        expect(Auth0ManagementClient).to have_received(:list_users).with(
          hash_including(page: '1', per_page: '50')
        )
      end
    end
  end
end
