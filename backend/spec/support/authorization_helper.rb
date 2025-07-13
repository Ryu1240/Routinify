module AuthorizationHelper
  def mock_controller_authentication(controller, user_id: 'test-user-id')
    # 認証をスキップ
    allow_any_instance_of(ApplicationController).to receive(:authorize).and_return(true)

    # ダミーのトークンを作成
    decoded_token = double('decoded_token')
    allow(decoded_token).to receive(:user_id).and_return(user_id)
    allow(decoded_token).to receive(:sub).and_return(user_id)
    allow(decoded_token).to receive(:validate_permissions).and_return(true)
    allow(decoded_token).to receive(:token).and_return([ { 'sub' => user_id } ])

    # @decoded_tokenを設定
    controller.instance_variable_set(:@decoded_token, decoded_token)
  end
end
