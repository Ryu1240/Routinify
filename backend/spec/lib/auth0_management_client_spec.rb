# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Auth0ManagementClient, type: :lib do
  let(:domain) { 'test-domain.auth0.com' }
  let(:client_id) { 'test_client_id' }
  let(:client_secret) { 'test_client_secret' }
  let(:access_token) { 'test_access_token' }
  let(:management_api_url) { "https://#{domain}/api/v2" }

  before do
    allow(ENV).to receive(:fetch).with('AUTH0_DOMAIN', nil).and_return(domain)
    allow(ENV).to receive(:fetch).with('AUTH0_MANAGEMENT_API_CLIENT_ID', nil).and_return(client_id)
    allow(ENV).to receive(:fetch).with('AUTH0_MANAGEMENT_API_CLIENT_SECRET', nil).and_return(client_secret)
  end

  describe '.access_token' do
    context '環境変数が正しく設定されている場合' do
      let(:token_response) do
        double(
          success?: true,
          body: { access_token: access_token }.to_json
        )
      end

      it 'アクセストークンを取得できること' do
        expected_body = {
          client_id:,
          client_secret:,
          audience: "https://#{domain}/api/v2/",
          grant_type: 'client_credentials'
        }.to_json

        expect(HTTParty).to receive(:post).with(
          "https://#{domain}/oauth/token",
          hash_including(
            body: expected_body,
            headers: { 'Content-Type' => 'application/json' }
          )
        ).and_return(token_response)

        expect(described_class.access_token).to eq(access_token)
      end
    end

    context '環境変数が設定されていない場合' do
      it 'AUTH0_DOMAINが設定されていない場合にエラーを発生させること' do
        allow(ENV).to receive(:fetch).with('AUTH0_DOMAIN', nil).and_return(nil)

        expect { described_class.access_token }.to raise_error('AUTH0_DOMAIN is not set')
      end

      it 'AUTH0_MANAGEMENT_API_CLIENT_IDが設定されていない場合にエラーを発生させること' do
        allow(ENV).to receive(:fetch).with('AUTH0_MANAGEMENT_API_CLIENT_ID', nil).and_return(nil)

        expect { described_class.access_token }.to raise_error('AUTH0_MANAGEMENT_API_CLIENT_ID is not set')
      end

      it 'AUTH0_MANAGEMENT_API_CLIENT_SECRETが設定されていない場合にエラーを発生させること' do
        allow(ENV).to receive(:fetch).with('AUTH0_MANAGEMENT_API_CLIENT_SECRET', nil).and_return(nil)

        expect { described_class.access_token }.to raise_error('AUTH0_MANAGEMENT_API_CLIENT_SECRET is not set')
      end
    end

    context 'トークン取得に失敗した場合' do
      let(:error_response) do
        double(
          success?: false,
          body: { error: 'invalid_client' }.to_json
        )
      end

      it 'エラーを発生させること' do
        allow(HTTParty).to receive(:post).and_return(error_response)

        expect { described_class.access_token }.to raise_error(/Failed to get access token/)
      end
    end
  end

  describe '.get_user' do
    let(:user_id) { 'auth0|123' }
    let(:user_data) do
      {
        user_id: user_id,
        email: 'user@example.com',
        name: 'Test User'
      }
    end

    before do
      allow(described_class).to receive(:access_token).and_return(access_token)
    end

    context 'ユーザーが存在する場合' do
      it 'ユーザー情報を取得できること' do
        user_response = double(
          code: 200,
          success?: true,
          body: user_data.to_json
        )

        expect(HTTParty).to receive(:get).with(
          "#{management_api_url}/users/#{URI.encode_www_form_component(user_id)}",
          headers: { 'Authorization' => "Bearer #{access_token}" }
        ).and_return(user_response)

        result = described_class.get_user(user_id)
        expect(result['user_id']).to eq(user_id)
        expect(result['email']).to eq('user@example.com')
      end
    end

    context 'ユーザーが存在しない場合' do
      it 'nilを返すこと' do
        not_found_response = double(
          code: 404,
          success?: false,
          body: { error: 'Not Found' }.to_json
        )

        expect(HTTParty).to receive(:get).with(
          "#{management_api_url}/users/#{URI.encode_www_form_component(user_id)}",
          headers: { 'Authorization' => "Bearer #{access_token}" }
        ).and_return(not_found_response)

        result = described_class.get_user(user_id)
        expect(result).to be_nil
      end
    end

    context 'APIリクエストが失敗した場合（404以外）' do
      it 'エラーを発生させること' do
        error_response = double(
          code: 500,
          success?: false,
          body: { error: 'Internal Server Error' }.to_json
        )

        expect(HTTParty).to receive(:get).with(
          "#{management_api_url}/users/#{URI.encode_www_form_component(user_id)}",
          headers: { 'Authorization' => "Bearer #{access_token}" }
        ).and_return(error_response)

        expect { described_class.get_user(user_id) }.to raise_error(/Failed to get user/)
      end
    end

    context '特殊文字を含むユーザーIDの場合' do
      let(:user_id_with_special_chars) { 'auth0|user@domain|123' }

      it 'URLエンコードされたIDでリクエストすること' do
        user_response = double(
          code: 200,
          success?: true,
          body: user_data.to_json
        )

        expect(HTTParty).to receive(:get).with(
          "#{management_api_url}/users/#{URI.encode_www_form_component(user_id_with_special_chars)}",
          headers: { 'Authorization' => "Bearer #{access_token}" }
        ).and_return(user_response)

        described_class.get_user(user_id_with_special_chars)
      end
    end
  end

  describe '.list_users' do
    let(:users_response_body) do
      {
        users: [
          { user_id: 'auth0|1', email: 'user1@example.com' },
          { user_id: 'auth0|2', email: 'user2@example.com' }
        ],
        total: 2,
        start: 0,
        limit: 50
      }.to_json
    end

    let(:users_response) do
      double(
        success?: true,
        body: users_response_body
      )
    end

    before do
      allow(described_class).to receive(:access_token).and_return(access_token)
    end

    context 'パラメータなしの場合' do
      it 'デフォルトパラメータでユーザーリストを取得できること' do
        expect(HTTParty).to receive(:get).with(
          "#{management_api_url}/users?page=0&per_page=50&include_totals=true",
          headers: { 'Authorization' => "Bearer #{access_token}" }
        ).and_return(users_response)

        result = described_class.list_users

        expect(result['users'].length).to eq(2)
        expect(result['total']).to eq(2)
      end
    end

    context 'ページネーションパラメータを指定した場合' do
      it '指定したパラメータでユーザーリストを取得できること' do
        expect(HTTParty).to receive(:get).with(
          "#{management_api_url}/users?page=1&per_page=20&include_totals=true",
          headers: { 'Authorization' => "Bearer #{access_token}" }
        ).and_return(users_response)

        result = described_class.list_users(page: 1, per_page: 20)

        expect(result['users'].length).to eq(2)
      end
    end

    context '検索パラメータを指定した場合' do
      it '検索クエリでユーザーリストを取得できること' do
        expect(HTTParty).to receive(:get).with(
          match(/#{management_api_url}\/users\?.*q=email%3Auser1%40example\.com.*/),
          headers: { 'Authorization' => "Bearer #{access_token}" }
        ).and_return(users_response)

        result = described_class.list_users(q: 'email:user1@example.com')

        expect(result['users'].length).to eq(2)
      end
    end

    context 'ソートパラメータを指定した場合' do
      it 'ソートパラメータでユーザーリストを取得できること' do
        expect(HTTParty).to receive(:get).with(
          match(/#{management_api_url}\/users\?.*sort=email%3A1.*/),
          headers: { 'Authorization' => "Bearer #{access_token}" }
        ).and_return(users_response)

        result = described_class.list_users(sort: 'email', order: '1')

        expect(result['users'].length).to eq(2)
      end
    end

    context 'APIリクエストが失敗した場合' do
      let(:error_response) do
        double(
          success?: false,
          body: { error: 'Unauthorized' }.to_json
        )
      end

      it 'エラーを発生させること' do
        allow(HTTParty).to receive(:get).and_return(error_response)

        expect { described_class.list_users }.to raise_error(/Failed to list users/)
      end
    end
  end

  describe '.delete_user' do
    let(:user_id) { 'auth0|123' }

    before do
      allow(described_class).to receive(:access_token).and_return(access_token)
    end

    context '削除が成功した場合（204 No Content）' do
      it 'trueを返すこと' do
        success_response = double(
          code: 204,
          success?: true
        )

        expect(HTTParty).to receive(:delete).with(
          "#{management_api_url}/users/#{URI.encode_www_form_component(user_id)}",
          headers: { 'Authorization' => "Bearer #{access_token}" }
        ).and_return(success_response)

        expect(described_class.delete_user(user_id)).to be true
      end
    end

    context '削除が成功した場合（その他の2xx）' do
      it 'trueを返すこと' do
        success_response = double(
          code: 200,
          success?: true
        )

        expect(HTTParty).to receive(:delete).with(
          "#{management_api_url}/users/#{URI.encode_www_form_component(user_id)}",
          headers: { 'Authorization' => "Bearer #{access_token}" }
        ).and_return(success_response)

        expect(described_class.delete_user(user_id)).to be true
      end
    end

    context 'ユーザーが見つからない場合（404）' do
      it ':not_foundを返すこと' do
        not_found_response = double(
          code: 404,
          success?: false,
          body: { error: 'Not Found' }.to_json
        )

        expect(HTTParty).to receive(:delete).with(
          "#{management_api_url}/users/#{URI.encode_www_form_component(user_id)}",
          headers: { 'Authorization' => "Bearer #{access_token}" }
        ).and_return(not_found_response)

        expect(described_class.delete_user(user_id)).to eq(:not_found)
      end
    end

    context '削除が失敗した場合（404以外のエラー）' do
      it 'falseを返すこと' do
        error_response = double(
          code: 500,
          success?: false,
          body: { error: 'Internal Server Error' }.to_json
        )

        expect(HTTParty).to receive(:delete).with(
          "#{management_api_url}/users/#{URI.encode_www_form_component(user_id)}",
          headers: { 'Authorization' => "Bearer #{access_token}" }
        ).and_return(error_response)

        expect(described_class.delete_user(user_id)).to be false
      end
    end

    context '特殊文字を含むユーザーIDの場合' do
      let(:user_id_with_special_chars) { 'auth0|user@domain|123' }

      it 'URLエンコードされたIDでリクエストすること' do
        success_response = double(
          code: 204,
          success?: true
        )

        expect(HTTParty).to receive(:delete).with(
          "#{management_api_url}/users/#{URI.encode_www_form_component(user_id_with_special_chars)}",
          headers: { 'Authorization' => "Bearer #{access_token}" }
        ).and_return(success_response)

        described_class.delete_user(user_id_with_special_chars)
      end
    end
  end

  describe '.build_query_params' do
    it 'ページネーションパラメータを構築できること' do
      params = { page: 2, per_page: 25 }
      result = described_class.send(:build_query_params, params)

      expect(result).to include('page=2')
      expect(result).to include('per_page=25')
      expect(result).to include('include_totals=true')
    end

    it '検索パラメータを構築できること' do
      params = { q: 'email:test@example.com' }
      result = described_class.send(:build_query_params, params)

      expect(result).to include('q=email%3Atest%40example.com')
    end

    it 'ソートパラメータを構築できること' do
      params = { sort: 'created_at', order: '-1' }
      result = described_class.send(:build_query_params, params)

      expect(result).to include('sort=created_at%3A-1')
    end

    it 'nil値を除外できること' do
      params = { page: 0, q: nil, sort: nil }
      result = described_class.send(:build_query_params, params)

      expect(result).not_to include('q=')
      expect(result).not_to include('sort=')
      expect(result).to include('page=0')
    end

    it 'デフォルト値が適用されること' do
      params = {}
      result = described_class.send(:build_query_params, params)

      expect(result).to include('page=0')
      expect(result).to include('per_page=50')
      expect(result).to include('include_totals=true')
    end
  end
end
