# Developer Log - Controller Spec → Request Spec 移行記録

## 概要
Rails API の Controller Spec を Request Spec に移行する際に遭遇した問題と解決策を詳細に記録。

---

## 移行の背景
- **目的**: より実践的なHTTPリクエスト・レスポンステスト実現
- **動機**: Rails推奨のテスト方式への準拠
- **対象**: POST /tasks エンドポイントのテスト（44テスト → 24テスト）

---

## 主要な問題と解決策

### 1. 認証システムの根本的な違い

#### 問題
```ruby
# Controller Spec（動作する）
before do
  mock_controller_authentication(controller, user_id: user_id)
end

# Request Spec（403 Forbiddenエラー）
before do
  mock_request_authentication(user_id: user_id)
end
```

**エラー**: 全てのリクエストで `403 Forbidden` レスポンス

#### 原因分析
1. **Controller Spec**: `controller` インスタンスに直接アクセス可能
   ```ruby
   controller.instance_variable_set(:@decoded_token, decoded_token)
   ```

2. **Request Spec**: 実際のHTTPリクエストを通すため、コントローラーインスタンスへの直接アクセス不可能

3. **認証スキップ範囲の問題**:
   ```ruby
   # ApplicationController
   before_action :authorize, unless: -> { self.class.skip_auth_for_test }
   ```
   
   `skip_auth_for_test` は `authorize` メソッドのみスキップし、`validate_permissions` には影響しない

#### 解決策
```ruby
# Secured#validate_permissions を拡張
def validate_permissions(permissions)
  raise 'validate_permissions needs to be called with a block' unless block_given?
  
  # テスト環境で認証スキップが有効な場合は権限チェックをスキップ
  return yield if defined?(ApplicationController) && ApplicationController.skip_auth_for_test
  
  return yield if @decoded_token.validate_permissions(permissions)
  render json: INSUFFICIENT_PERMISSIONS, status: :forbidden
end
```

### 2. Rails 8 Host Authorization 問題

#### 問題
```
Response body: <!DOCTYPE html>
<html lang="en">
<head>
  <title>Action Controller: Exception caught</title>
...
<header>
  <h1>Blocked hosts: www.example.com</h1>
</header>
```

**エラー**: Rails 8 の Host Authorization middleware がテストリクエストをブロック

#### 原因
Request Spec では実際のHTTPリクエストが送信されるため、Host Authorization チェックが動作する

#### 解決策
```ruby
# Request Spec のヘッダー設定
let(:auth_headers) { 
  { 
    'Authorization' => "Bearer #{dummy_token}", 
    'Host' => 'localhost'  # 適切なHostヘッダーを設定
  } 
}
```

### 3. @decoded_token インスタンス変数の設定困難

#### 問題
```ruby
# Controller Spec（直接設定可能）
controller.instance_variable_set(:@decoded_token, decoded_token)

# Request Spec（設定方法が不明確）
allow_any_instance_of(ApplicationController).to receive(:instance_variable_get)
  .with(:@decoded_token).and_return(decoded_token)  # 動作しない
```

#### 原因
Request Spec では実際のコントローラーインスタンスが動的に生成されるため、事前にインスタンス変数を設定することが困難

#### 解決策
```ruby
def mock_request_authentication(user_id: 'test-user-id')
  # 省略: decoded_token 作成
  
  # authorize メソッドを上書きして@decoded_tokenを設定
  allow_any_instance_of(ApplicationController).to receive(:authorize) do |controller|
    controller.instance_variable_set(:@decoded_token, decoded_token)
  end
end
```

### 4. テストメソッドの構文変更

#### 変更点
```ruby
# Controller Spec
get :index                              # アクション呼び出し
post :create, params: valid_params      # パラメータ指定

# Request Spec  
get '/api/v1/tasks', headers: auth_headers                    # URL指定
post '/api/v1/tasks', params: valid_params, headers: auth_headers  # ヘッダー必須
```

---

## 学んだ教訓

### 1. 認証システムの複雑さ
- **Controller Spec**: 単体テスト的、認証を完全にモック化
- **Request Spec**: 統合テスト的、実際のHTTP処理を通る

### 2. Rails バージョン固有の問題
- Rails 8 の Host Authorization は Request Spec で顕著に現れる
- 環境設定とテスト設定の一貫性が重要

### 3. モッキング戦略の違い
```ruby
# Controller Spec: インスタンスレベルのモック
controller.instance_variable_set(:@decoded_token, token)

# Request Spec: メソッドレベルのモック + インスタンス変数設定
allow_any_instance_of(ApplicationController).to receive(:authorize) do |controller|
  controller.instance_variable_set(:@decoded_token, token)
end
```

### 4. デバッグ手法
```ruby
# レスポンス内容の詳細確認
puts "Response status: #{response.status}"
puts "Response body: #{response.body}" if response.status != 200
```

---

## 最終的な移行結果

### 成功指標
- **テスト実行**: 19/24 テスト成功（主要機能全て動作）
- **認証統合**: Auth0 認証模擬が Request Spec で正常動作
- **実践性**: 実際のHTTPリクエスト・レスポンステストを実現

### 残課題
- 例外ハンドリングテスト（5つ）: Controller Spec と Request Spec の例外処理差異
- 今後は Request Spec を標準とし、例外テストは個別対応

---

## 推奨事項

### Request Spec 導入時のチェックリスト
1. **Host Authorization 設定確認**
   ```ruby
   # config/environments/test.rb
   config.hosts.clear
   ```

2. **認証スキップ機能の拡張**
   ```ruby
   # Securedモジュール等の権限チェック箇所
   return yield if ApplicationController.skip_auth_for_test
   ```

3. **適切なヘッダー設定**
   ```ruby
   let(:auth_headers) { { 'Authorization' => "Bearer token", 'Host' => 'localhost' } }
   ```

4. **段階的移行**
   - 1つのテストファイルから開始
   - 認証系テストを最初に確立
   - 正常系 → 異常系の順で移行

### 避けるべき落とし穴
- Controller Spec の認証ヘルパーをそのまま Request Spec で使用
- Host ヘッダーの設定忘れ
- `skip_auth_for_test` の影響範囲の誤解
- インスタンス変数の設定方法の混同

---

## 技術的な詳細

### Auth0 統合での Request Spec 対応
```ruby
def mock_request_authentication(user_id: 'test-user-id')
  decoded_token = double('decoded_token')
  allow(decoded_token).to receive(:validate_permissions).and_return(true)
  allow(decoded_token).to receive(:token).and_return([{ 'sub' => user_id }])

  allow_any_instance_of(ApplicationController).to receive(:authorize) do |controller|
    controller.instance_variable_set(:@decoded_token, decoded_token)
  end

  allow_any_instance_of(ApplicationController).to receive(:current_user_id).and_return(user_id)
end
```

### Rails 8 対応の重要性
- Host Authorization の適切な設定
- テスト環境での制限解除
- Request Spec でのヘッダー設定の重要性

この移行経験は、Rails API の認証システムをより深く理解する良い機会となった。