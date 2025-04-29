require 'rails_helper'

RSpec.describe 'Api::V1::Auth', type: :request do
  describe 'POST /api/v1/auth/login' do
    let(:user) { create(:user) }

    context '正しい認証情報が提供された場合' do
      it 'トークンとユーザー情報を返すこと' do
        post '/api/v1/auth/login', params: { email: user.email, password: 'password123' }
        
        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json['token']).to be_present
        expect(json['user']['email']).to eq(user.email)
      end
    end

    context '不正な認証情報が提供された場合' do
      it '認証エラーを返すこと' do
        post '/api/v1/auth/login', params: { email: user.email, password: 'wrong_password' }
        
        expect(response).to have_http_status(:unauthorized)
        json = JSON.parse(response.body)
        expect(json['error']).to eq('Invalid email or password')
      end
    end
  end

  describe 'POST /api/v1/auth/logout' do
    let(:user) { create(:user) }
    let(:token) { user.generate_jwt }

    it 'ログアウト成功のメッセージを返すこと' do
      post '/api/v1/auth/logout', headers: { 'Authorization' => "Bearer #{token}" }
      
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['message']).to eq('Logged out successfully')
    end
  end
end 