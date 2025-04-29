require 'rails_helper'

RSpec.describe 'Api::V1::Users', type: :request do
  describe 'POST /api/v1/users' do
    let(:valid_attributes) do
      {
        user: {
          email: 'test@example.com',
          password: 'password123'
        }
      }
    end

    context '有効なパラメータが提供された場合' do
      it 'ユーザーを作成し、トークンとユーザー情報を返すこと' do
        expect {
          post '/api/v1/users', params: valid_attributes
        }.to change(User, :count).by(1)

        expect(response).to have_http_status(:created)
        json = JSON.parse(response.body)
        expect(json['token']).to be_present
        expect(json['user']['email']).to eq('test@example.com')
      end
    end

    context '無効なパラメータが提供された場合' do
      it 'ユーザーを作成せず、エラーを返すこと' do
        expect {
          post '/api/v1/users', params: { user: { email: 'invalid_email', password: 'short' } }
        }.not_to change(User, :count)

        expect(response).to have_http_status(:unprocessable_entity)
        json = JSON.parse(response.body)
        expect(json['errors']).to be_present
      end
    end
  end
end 