require 'rails_helper'

RSpec.shared_context 'admin users request spec setup' do
  let(:user_id) { 'test-admin-user-id' }
  let(:dummy_token) { 'dummy-token' }
  let(:auth_headers) { { 'Authorization' => "Bearer #{dummy_token}", 'Host' => 'localhost' } }

  before do
    # テスト環境でのみ認証をスキップ
    mock_request_authentication(user_id: user_id)
  end
end
