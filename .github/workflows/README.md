# GitHub Actions ワークフロー

このディレクトリには、RoutinifyプロジェクトのCI/CDパイプライン用のGitHub Actionsワークフローが含まれています。

## ワークフロー一覧

### PR Tests (`pr-tests.yml`)

PR作成時およびmain/developブランチへのプッシュ時に実行されるテストワークフローです。

#### 実行タイミング
- Pull Request作成時
- mainブランチへのプッシュ
- developブランチへのプッシュ

#### 実行内容

**Backend Tests**
- Ruby 3.3のセットアップ
- PostgreSQL 15のサービスコンテナ起動
- データベースのセットアップ
- RSpecテストの実行
- RuboCopによるコードスタイルチェック
- Brakemanによるセキュリティチェック

**Frontend Tests**
- Node.js 18のセットアップ
- pnpmのインストール
- 依存関係のインストール
- Vitestによるテスト実行
- TypeScriptの型チェック

**Test Results Summary**
- テスト結果の集約
- GitHub PRへのテスト結果コメント投稿

#### アーティファクト

テスト結果は以下のアーティファクトとして保存されます：
- `backend-test-results`: RSpec、RuboCop、Brakemanの結果
- `frontend-test-results`: Vitestのテスト結果

#### 環境変数

Backendテストで使用される環境変数：
- `DATABASE_HOST`: localhost
- `DATABASE_USERNAME`: postgres
- `DATABASE_PASSWORD`: password
- `RAILS_ENV`: test

## 使用方法

1. このワークフローは自動的に実行されます
2. PRを作成すると、BackendとFrontendのテストが並行実行されます
3. テスト結果はPRにコメントとして投稿されます
4. 失敗したテストがある場合は、詳細な情報が表示されます

## トラブルシューティング

### よくある問題

1. **PostgreSQL接続エラー**
   - サービスコンテナのヘルスチェックを確認
   - データベース設定を確認

2. **依存関係のインストールエラー**
   - キャッシュをクリアして再実行
   - ロックファイルの整合性を確認

3. **テストタイムアウト**
   - テストの実行時間を確認
   - 必要に応じてタイムアウト時間を調整

### ローカルでのテスト実行

ワークフローと同じ環境でテストを実行する場合：

```bash
# Backend
cd backend
bundle install
bundle exec rspec

# Frontend
cd frontend
pnpm install
pnpm test:run
``` 