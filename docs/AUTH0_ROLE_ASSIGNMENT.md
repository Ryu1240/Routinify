# Auth0 ロール自動付与システム

## 概要

このドキュメントでは、Auth0を使用した認証システムにおいて、新規ユーザーやロールを持っていないユーザーに自動的に"user"ロールを付与する仕組みについて説明します。

システムは2層のフォールバック構造を持っています：

1. **Auth0 Post Login Action（推奨・主要）**: ユーザーがログインした際に、ロールを持っていない場合に自動的に"user"ロールを付与
2. **バックエンドフォールバック**: Auth0 Actionが失敗した場合や、初回ログイン時のAPI呼び出し時に、バックエンドでロールを付与

## アーキテクチャ

```
┌─────────────────┐
│  ユーザーログイン  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Auth0 Post Login Action         │
│  - ロールチェック                 │
│  - ロール未所持の場合に付与         │
└────────┬────────────────────────┘
         │
         ▼
    ┌────────┐
    │ 成功？  │
    └───┬────┘
        │
   ┌────┴────┐
   │         │
   ▼         ▼
 成功     失敗/スキップ
   │         │
   │         ▼
   │    ┌──────────────────┐
   │    │ バックエンドAPI    │
   │    │ AuthService       │
   │    │ フォールバック処理 │
   │    └──────────────────┘
   │
   ▼
ロール付与完了
```

## セットアップ手順

### 1. Auth0 Management API M2Mアプリケーションの作成

1. Auth0ダッシュボード > **Applications** > **Applications** を開く
2. **「+ Create Application」**をクリック
3. 以下の情報を入力:
   - **Name**: "Role Assignment Action"（任意の名前）
   - **Application Type**: **"Machine to Machine Applications"**
4. **「Create」**をクリック
5. **Authorized for**: **"Auth0 Management API"** を選択
6. 以下のスコープを有効化:
   - `read:roles` - ロール情報の読み取り
   - `read:users` - ユーザー情報の読み取り
   - `update:users` - ユーザー情報の更新（ロール付与に必要）
7. **「Authorize」**をクリック
8. **Client ID**と**Client Secret**をメモ（後で使用）

### 2. Auth0ロールの作成

1. Auth0ダッシュボード > **User Management** > **Roles** を開く
2. **「+ Create Role」**をクリック
3. 以下の情報を入力:
   - **Name**: `user`
   - **Description**: "Default user role"（任意）
4. **「Create」**をクリック

### 3. Auth0 Actionの作成

1. Auth0ダッシュボード > **Actions** > **Library** を開く
2. **「+ Create Action」**をクリック
3. **「Build Custom」**を選択
4. 以下の情報を入力:
   - **Name**: "Assign User Role on First Login"
   - **Trigger**: **"Post Login"**（重要）
5. `auth0-action-assign-user-role-post-login.js` の内容をコピー＆ペースト
6. **「Deploy」**をクリック

### 4. 環境変数の設定

作成したActionの**「Settings」**タブで、以下の環境変数を設定:

| 環境変数名 | 説明 | 例 |
|-----------|------|-----|
| `AUTH0_DOMAIN` | Auth0ドメイン | `dev-x7dol3ce1bkdedsn.jp.auth0.com` |
| `AUTH0_MANAGEMENT_API_CLIENT_ID` | M2MアプリケーションのClient ID | （ステップ1で取得） |
| `AUTH0_MANAGEMENT_API_CLIENT_SECRET` | M2MアプリケーションのClient Secret | （ステップ1で取得） |

### 5. Loginフローへの追加

1. Auth0ダッシュボード > **Actions** > **Flows** を開く
2. **「Login」**フローを選択（**Post User Registrationではない**）
3. 作成した**「Assign User Role on First Login」**アクションをドラッグ＆ドロップで追加
4. **「Apply」**をクリック

## 動作の詳細

### Auth0 Post Login Actionの動作

1. **ログイン検知**: ユーザーがログインした際に、Post Loginトリガーが実行される
2. **ロールチェック**: Management APIを使用して、ユーザーが既にロールを持っているか確認
3. **ロール付与**: ロールを持っていない場合のみ、"user"ロールを付与
4. **スキップ**: 既にロールを持っている場合は処理をスキップ

### バックエンドフォールバックの動作

バックエンドの`AuthService`は、初回ログイン時に以下の処理を実行します：

1. **ロール取得**: Management APIを使用してユーザーのロールを取得
2. **ロールチェック**: ロールが空の場合、自動的に"user"ロールを付与
3. **再取得**: ロール付与後、再度ロール情報を取得してレスポンスに含める

```ruby
# backend/app/services/auth_service.rb
if roles.empty?
  assign_default_role(user_id)
  roles = fetch_user_roles(user_id)
end
```

## なぜPost Loginアクションを使用するのか

Auth0の公式ドキュメントでは、**Post User Registrationアクションはユーザーのプロファイルを更新するためには推奨されていない**と記載されています。

### Post User Registrationの問題点

- ユーザーが完全に作成される前に実行される可能性がある
- 非同期で実行されるため、タイミングの問題が発生する
- ユーザーが存在しないエラー（404）が発生する可能性がある
- リトライロジックが必要で、実行時間制限に達する可能性がある

### Post Loginの利点

- ✅ ユーザーが確実に存在する状態で実行される
- ✅ リトライロジックが不要
- ✅ 実行時間制限の問題がない
- ✅ Auth0の公式推奨方法

## 動作確認

### 1. 新規ユーザーでのテスト

1. 新しいユーザーでサインアップ
2. 作成したユーザーでログイン
3. Auth0ダッシュボード > **User Management** > **Users** でユーザーを確認
4. ユーザーの**「Roles」**タブで"user"ロールが付与されていることを確認

### 2. 既存ユーザー（ロールなし）でのテスト

1. ロールを持っていない既存ユーザーでログイン
2. Auth0ダッシュボードでユーザーを確認
3. "user"ロールが付与されていることを確認

### 3. ロール付与済みユーザーでのテスト

1. 既にロールを持っているユーザーでログイン
2. Auth0 Actionのログで「ロール付与をスキップします」と表示されることを確認
3. 既存のロールが維持されていることを確認

## トラブルシューティング

### ロールが付与されない

#### 原因1: ロールが存在しない
**症状**: Auth0 Actionのログに「ロール "user" が見つかりません」と表示される

**解決方法**:
1. Auth0ダッシュボード > **User Management** > **Roles** で"user"ロールが存在するか確認
2. 存在しない場合は、ロールを作成

#### 原因2: 環境変数が設定されていない
**症状**: Auth0 Actionのログに「必要な環境変数が設定されていません」と表示される

**解決方法**:
1. Auth0 Actionの**「Settings」**タブを開く
2. 以下の環境変数が正しく設定されているか確認:
   - `AUTH0_DOMAIN`
   - `AUTH0_MANAGEMENT_API_CLIENT_ID`
   - `AUTH0_MANAGEMENT_API_CLIENT_SECRET`

#### 原因3: M2Mアプリケーションのスコープが不足
**症状**: Management API呼び出し時に403エラーが発生

**解決方法**:
1. M2Mアプリケーションの設定を確認
2. 以下のスコープが有効化されているか確認:
   - `read:roles`
   - `read:users`
   - `update:users`

#### 原因4: バックエンドフォールバックに依存している
**症状**: Auth0 Actionが失敗しているが、バックエンドでロールが付与される

**解決方法**:
1. Auth0 Actionのログを確認してエラーの原因を特定
2. 上記の原因1-3を確認

### ログの確認方法

#### Auth0 Actionのログ
1. Auth0ダッシュボード > **Actions** > **Library** を開く
2. 「Assign User Role on First Login」アクションを選択
3. **「Deploy」**タブでログを確認

#### バックエンドのログ
バックエンドのログで以下のメッセージを確認：
- `Assigned default role 'user' to user {user_id}` - ロール付与成功
- `Failed to assign default role 'user' to user {user_id}` - ロール付与失敗

## セキュリティ考慮事項

1. **最小権限の原則**: M2Mアプリケーションには必要最小限のスコープのみを付与
2. **環境変数の保護**: Client Secretは適切に管理し、漏洩しないように注意
3. **ログの監視**: 定期的にAuth0 Actionのログを確認し、異常がないかチェック

## 関連ファイル

- **Auth0 Action**: `auth0-action-assign-user-role-post-login.js`
- **バックエンド**: `backend/app/services/auth_service.rb`
- **Management API Client**: `backend/lib/auth0_management_client.rb`

## 参考資料

- [Auth0 Actions - Post Login Trigger](https://auth0.com/docs/customize/actions/flows-and-triggers/login-flow/trigger-login-actions-post-login)
- [Auth0 Management API - Assign Roles to User](https://auth0.com/docs/api/management/v2#!/Users/post_user_roles)
- [Auth0 Actions - Post User Registration Trigger](https://auth0.com/docs/customize/actions/flows-and-triggers/sign-up-flow/post-user-registration-trigger)

