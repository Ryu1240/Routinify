# GitHub Actions ワークフロー

このディレクトリには、RoutinifyプロジェクトのCI/CDパイプライン用のGitHub Actionsワークフローが含まれています。

## ワークフロー一覧

### PR Tests (`pr-tests.yml`)

PR作成時およびmain/developブランチへのプッシュ時に実行されるテストワークフローです。

#### 実行タイミング
- Pull Request作成時
- mainブランチへのプッシュ
- developブランチへのプッシュ
- **手動実行**（GitHub UIから）

#### 手動実行方法

GitHubのリポジトリページから手動でワークフローを実行できます：

1. **GitHubリポジトリページ**にアクセス
2. **Actions**タブをクリック
3. 左側のメニューから**PR Tests**を選択
4. **Run workflow**ボタンをクリック
5. 実行オプションを設定：
   - **Run backend tests**: Backendテストの実行（デフォルト: true）
   - **Run frontend tests**: Frontendテストの実行（デフォルト: true）
   - **Run TypeScript type check**: 型チェックの実行（デフォルト: true）
   - **Run linting and security checks**: リンターとセキュリティチェック（デフォルト: true）
6. **Run workflow**をクリックして実行開始

#### 実行内容

**Backend Tests**
- Ruby 3.4.2のセットアップ（Docker環境と一致）
- PostgreSQL 15のサービスコンテナ起動
- データベースのセットアップ
- RSpecテストの実行
- RuboCopによるコードスタイルチェック（手動実行時はオプション）
- Brakemanによるセキュリティチェック（手動実行時はオプション）

**Frontend Tests**
- Node.js 20のセットアップ（Docker環境と一致）
- pnpmのインストール
- 依存関係のインストール
- Vitestによるテスト実行
- TypeScriptの型チェック（手動実行時はオプション）

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

### GitHub Actions（自動実行）

1. このワークフローは自動的に実行されます
2. PRを作成すると、BackendとFrontendのテストが並行実行されます
3. テスト結果はPRにコメントとして投稿されます
4. 失敗したテストがある場合は、詳細な情報が表示されます

### GitHub Actions（手動実行）

特定のテストのみを実行したい場合や、PR以外のブランチでテストを実行したい場合：

1. **GitHub UI**から手動実行
2. **実行オプション**を選択して必要なテストのみ実行
3. **実行結果**を確認

### Docker環境でのローカルテスト

#### 前提条件
```bash
# Dockerコンテナを起動
docker-compose up -d
```

#### テスト実行方法

**1. Makefileを使用**
```bash
# すべてのテストを実行
make test-all

# Backendテストのみ
make test-backend

# Frontendテストのみ
make test-frontend

# 型チェック
make type-check

# リンター
make lint-backend

# セキュリティチェック
make security-check
```

**2. 直接実行**
```bash
# Backendテスト
docker-compose exec backend bundle exec rspec

# Frontendテスト
docker-compose exec frontend pnpm test:run

# 型チェック
docker-compose exec frontend pnpm tsc --noEmit

# RuboCop
docker-compose exec backend bundle exec rubocop

# Brakeman
docker-compose exec backend bundle exec brakeman
```

## バージョン互換性

GitHub ActionsワークフローはDocker環境と互換性を保つように設定されています：

| コンポーネント | GitHub Actions | Docker | 互換性 |
|---------------|----------------|--------|--------|
| Ruby | 3.4.2 | 3.4.2 | ✅ |
| Node.js | 20 | 20 | ✅ |
| PostgreSQL | 15 | 15 | ✅ |
| pnpm | 8 | 8 | ✅ |
| TypeScript | 5.8.3 | 5.8.3 | ✅ |

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

4. **Docker環境でのテスト失敗**
   - コンテナが起動しているか確認
   - ボリュームマウントが正しく設定されているか確認

5. **TypeScript型エラー**
   - TypeScriptのバージョンが5.8.3以上であることを確認
   - @mantine/coreとの互換性を確認

6. **手動実行時の問題**
   - 実行オプションが正しく設定されているか確認
   - 必要なブランチが選択されているか確認

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