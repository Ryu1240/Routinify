require 'rails_helper'

RSpec.shared_context 'routine_tasks request spec setup' do
  let(:user_id) { 'test-user-id' }
  let(:dummy_token) { 'dummy-token' }
  let(:auth_headers) { { 'Authorization' => "Bearer #{dummy_token}", 'Host' => 'localhost' } }

  before do
    # テスト環境でのみ認証をスキップ
    mock_request_authentication(user_id: user_id)
  end
end
