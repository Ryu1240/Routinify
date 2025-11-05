# Auth0 Action: サインアップ時にロールを付与する

## 概要

このAuth0 Actionは、新規ユーザーがサインアップした際に自動的に"user"ロールを付与します。

## セットアップ手順

### 1. Management APIのM2Mアプリケーションの作成

1. Auth0ダッシュボード > Applications > Applications を開く
2. 「+ Create Application」をクリック
3. 以下の情報を入力:
   - Name: "Role Assignment Action"（任意の名前）
   - Application Type: "Machine to Machine Applications"
4. 「Create」をクリック
5. Authorized for: "Auth0 Management API" を選択
6. 以下のスコープを有効化:
   - `read:roles` - ロール情報の読み取り
   - `update:users` - ユーザー情報の更新
7. 「Authorize」をクリック

### 2. Auth0 Actionの作成

1. Auth0ダッシュボード > Actions > Library を開く
2. 「+ Create Action」をクリック
3. 「Build Custom」を選択
4. 以下の情報を入力:
   - Name: "Assign User Role on Signup"
   - Trigger: "Post User Registration"
5. `auth0-action-assign-user-role-post-login.js` の内容をコピー＆ペースト
6. 「Deploy」をクリック

### 3. 環境変数の設定

作成したActionの「Settings」タブで、以下の環境変数を設定:

- `AUTH0_DOMAIN`: Auth0ドメイン（例: `dev-x7dol3ce1bkdedsn.jp.auth0.com`）
- `AUTH0_MANAGEMENT_API_CLIENT_ID`: 作成したM2MアプリケーションのClient ID
- `AUTH0_MANAGEMENT_API_CLIENT_SECRET`: 作成したM2MアプリケーションのClient Secret

### 4. フローへの追加

1. Auth0ダッシュボード > Actions > Flows を開く
2. 「Post User Registration」フローを選択
3. 作成した「Assign User Role on Signup」アクションをドラッグ＆ドロップで追加
4. 「Apply」をクリック

## 動作確認

1. 新しいユーザーでサインアップ
2. Auth0ダッシュボード > User Management > Users で作成されたユーザーを確認
3. ユーザーの「Roles」タブで"user"ロールが付与されていることを確認

## 注意事項

- ロールが存在しない場合、エラーがログに記録されますが、サインアップ処理は続行されます
- エラーが発生した場合、バックエンドの初回ログイン時のフォールバック処理に頼ります
- M2Mアプリケーションのスコープは、必要最小限に設定してください
- ユーザーが完全に作成されるまで待機するため、最大2.5秒（500ms × 5回）の遅延が発生する可能性があります
- Post User Registrationトリガーでは、ユーザーがManagement APIで利用可能になるまで時間がかかる場合があるため、404エラーの場合は自動的にリトライします
- Auth0 Actionの実行時間制限（約10秒）を超えないように、リトライ回数と待機時間を調整しています
- すべてのリトライが失敗した場合でも、エラーを投げずにバックエンドのフォールバック処理に頼ります

