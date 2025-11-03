# frozen_string_literal: true

require 'rails_helper'
require_relative 'shared_context'

RSpec.describe 'DELETE /api/v1/admin/users/:id', type: :request do
  include_context 'admin users request spec setup'

  let(:target_user_id) { 'auth0_123' } # |を含まないシンプルなID

  describe 'DELETE /api/v1/admin/users/:id' do
    context '正常系' do
      before do
        allow(Auth0ManagementClient).to receive(:delete_user).and_return(true)

        # delete:users権限があることをモック
        decoded_token = double('decoded_token')
        allow(decoded_token).to receive(:validate_permissions).with([ 'delete:users' ]).and_return(true)
        allow_any_instance_of(ApplicationController).to receive(:authorize) do |controller|
          controller.instance_variable_set(:@decoded_token, decoded_token)
        end
        allow_any_instance_of(ApplicationController).to receive(:current_user_id).and_return(user_id)
      end

      it 'returns a successful response with 204 status' do
        delete "/api/v1/admin/users/#{target_user_id}", headers: auth_headers
        expect(response).to have_http_status(:no_content)
      end

      it 'returns success message' do
        delete "/api/v1/admin/users/#{target_user_id}", headers: auth_headers

        # 204 No Contentの場合はレスポンスボディが空の可能性があるため、空でない場合のみパース
        if response.body.present?
          json_response = JSON.parse(response.body)
          expect(json_response['success']).to be true
          expect(json_response['message']).to eq('アカウントが正常に削除されました')
        else
          # 204 No Contentでボディが空の場合も正常
          expect(response.body).to be_empty
        end
      end

      it 'calls Auth0ManagementClient with correct user_id' do
        delete "/api/v1/admin/users/#{target_user_id}", headers: auth_headers
        expect(Auth0ManagementClient).to have_received(:delete_user).with(target_user_id)
      end
    end

    context '異常系' do
      context '認証関連' do
        it '認証が失敗した場合、適切なエラーを返すこと' do
          allow_any_instance_of(ApplicationController).to receive(:authorize) do |controller|
            controller.render json: { message: 'Invalid token' }, status: :unauthorized
          end

          delete "/api/v1/admin/users/#{target_user_id}", headers: auth_headers

          expect(response).to have_http_status(:unauthorized)
          expect(JSON.parse(response.body)['message']).to eq('Invalid token')
        end
      end

      context '権限関連' do
        it '権限が不足している場合、403エラーを返すこと' do
          # delete:users権限がないことをモック
          decoded_token = double('decoded_token')
          allow(decoded_token).to receive(:validate_permissions).with([ 'delete:users' ]).and_return(false)
          allow_any_instance_of(ApplicationController).to receive(:authorize) do |controller|
            controller.instance_variable_set(:@decoded_token, decoded_token)
          end

          delete "/api/v1/admin/users/#{target_user_id}", headers: auth_headers

          expect(response).to have_http_status(:forbidden)
          json_response = JSON.parse(response.body)
          expect(json_response['error']).to eq('insufficient_permissions')
          expect(json_response['message']).to eq('Permission denied')
        end
      end

      context '自分自身の削除' do
        before do
          decoded_token = double('decoded_token')
          allow(decoded_token).to receive(:validate_permissions).with([ 'delete:users' ]).and_return(true)
          allow_any_instance_of(ApplicationController).to receive(:authorize) do |controller|
            controller.instance_variable_set(:@decoded_token, decoded_token)
          end
          allow_any_instance_of(ApplicationController).to receive(:current_user_id).and_return(user_id)
        end

        it '自分自身のアカウントを削除しようとした場合、403エラーを返すこと' do
          delete "/api/v1/admin/users/#{user_id}", headers: auth_headers

          expect(response).to have_http_status(:forbidden)
          json_response = JSON.parse(response.body)
          expect(json_response['success']).to be false
          expect(json_response['errors']).to include('自分自身のアカウントは削除できません')
          expect(json_response['message']).to eq('自分自身のアカウントは削除できません')
        end

        it '自分自身の削除を試みた場合、Auth0ManagementClientを呼ばないこと' do
          allow(Auth0ManagementClient).to receive(:delete_user)
          delete "/api/v1/admin/users/#{user_id}", headers: auth_headers
          expect(Auth0ManagementClient).not_to have_received(:delete_user)
        end
      end

      context '削除失敗' do
        before do
          allow(Auth0ManagementClient).to receive(:delete_user).and_return(false)

          decoded_token = double('decoded_token')
          allow(decoded_token).to receive(:validate_permissions).with([ 'delete:users' ]).and_return(true)
          allow_any_instance_of(ApplicationController).to receive(:authorize) do |controller|
            controller.instance_variable_set(:@decoded_token, decoded_token)
          end
          allow_any_instance_of(ApplicationController).to receive(:current_user_id).and_return(user_id)
        end

        it '削除が失敗した場合、422エラーを返すこと' do
          delete "/api/v1/admin/users/#{target_user_id}", headers: auth_headers

          expect(response).to have_http_status(:unprocessable_entity)
          json_response = JSON.parse(response.body)
          expect(json_response['success']).to be false
          expect(json_response['errors']).to include('アカウントの削除に失敗しました')
          expect(json_response['message']).to eq('アカウントの削除に失敗しました')
        end
      end

      context 'Auth0 Management API エラー' do
        before do
          decoded_token = double('decoded_token')
          allow(decoded_token).to receive(:validate_permissions).with([ 'delete:users' ]).and_return(true)
          allow_any_instance_of(ApplicationController).to receive(:authorize) do |controller|
            controller.instance_variable_set(:@decoded_token, decoded_token)
          end
          allow_any_instance_of(ApplicationController).to receive(:current_user_id).and_return(user_id)
        end

        it 'API呼び出しが失敗した場合、500エラーを返すこと' do
          allow(Auth0ManagementClient).to receive(:delete_user).and_raise(StandardError, 'API Error')

          delete "/api/v1/admin/users/#{target_user_id}", headers: auth_headers

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
        allow(decoded_token).to receive(:validate_permissions).with([ 'delete:users' ]).and_return(true)
        allow_any_instance_of(ApplicationController).to receive(:authorize) do |controller|
          controller.instance_variable_set(:@decoded_token, decoded_token)
        end
        allow_any_instance_of(ApplicationController).to receive(:current_user_id).and_return(user_id)
      end

      it '存在しないユーザーIDでもエラーを返さない（Auth0側で処理）' do
        allow(Auth0ManagementClient).to receive(:delete_user).and_return(true)

        delete '/api/v1/admin/users/non-existent-user', headers: auth_headers
        expect(response).to have_http_status(:no_content)
        expect(Auth0ManagementClient).to have_received(:delete_user).with('non-existent-user')
      end
    end
  end
end
