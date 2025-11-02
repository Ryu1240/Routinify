# Routinify Frontend

Routinify Frontendは、タスク管理アプリケーション「Routinify」のWebクライアントです。
React + TypeScriptで構築されたSPA（Single Page Application）として、直感的なUIと高速なユーザー体験を提供します。

## 📋 目次

- [概要](#概要)
- [技術スタック](#技術スタック)
- [セットアップ](#セットアップ)
- [開発](#開発)
- [テスト](#テスト)
- [ビルドとデプロイ](#ビルドとデプロイ)
- [ドキュメント](#ドキュメント)
- [コントリビューション](#コントリビューション)

## 概要

Routinify Frontendは、以下の機能を提供するReact SPAです：

- **タスク管理**: タスクのCRUD操作、ステータス管理、優先度設定
- **カテゴリ管理**: タスクの分類機能
- **習慣化タスク**: 繰り返しタスクの管理と自動生成
  - 習慣化タスクの作成・編集・削除
  - タスクの一括生成機能
  - 非同期ジョブのステータス監視
  - 頻度設定（日次・週次・月次・カスタム）
- **マイルストーン**: 複数のタスクをグループ化し、進捗状況を追跡
  - マイルストーンの作成・編集・削除
  - タスクとの関連付け・解除
  - 進捗率の表示
  - ステータス管理とフィルタリング
- **認証**: Auth0を使用したセキュアな認証
- **レスポンシブデザイン**: モバイル・タブレット・デスクトップ対応
- **リアルタイム更新**: 最新のタスク状態を即座に反映

## 技術スタック

### コア技術
- **React**: 18.2+ - UIライブラリ
- **TypeScript**: 5.8+ - 型安全な開発
- **React Router**: 6.22+ - クライアントサイドルーティング
- **Axios**: 1.6+ - HTTPクライアント

### UI/スタイリング
- **Mantine UI**: 8.3+ - コンポーネントライブラリ
- **Emotion**: 11.11+ - CSS-in-JS
- **Tabler Icons**: 3.34+ - アイコンセット

### 認証
- **Auth0**: 2.2+ - JWT認証

### 開発・テスト
- **Vitest**: 3.2+ - テストフレームワーク
- **Testing Library**: 13.4+ - コンポーネントテストユーティリティ
- **Prettier**: 3.2+ - コードフォーマッター
- **ESLint**: (設定追加予定) - 静的解析

### ビルド・開発サーバー
- **Create React App**: 5.0+ - ビルドツール
- **React Scripts**: 5.0+ - 開発サーバー

## セットアップ

### 前提条件

- Node.js 18+
- pnpm 8+ (または npm/yarn)
- Docker & Docker Compose（推奨）

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd Routinify/frontend
```

### 2. 依存関係のインストール

```bash
pnpm install
```

### 3. 環境変数の設定

```bash
cp .env.example .env
# .envファイルを編集して必要な環境変数を設定
```

必要な環境変数:
```env
REACT_APP_AUTH0_DOMAIN=your-auth0-domain.auth0.com
REACT_APP_AUTH0_CLIENT_ID=your-client-id
REACT_APP_AUTH0_AUDIENCE=https://your-api-audience
REACT_APP_API_URL=http://localhost:3000
```

### 4. 開発サーバーの起動

```bash
pnpm start
```

ブラウザで `http://localhost:3001` を開きます。

### Docker環境での開発

```bash
# ルートディレクトリから開発環境全体を起動
cd ../
make up

# ログの確認
make logs

# フロントエンドのみ再起動
docker-compose restart frontend
```

## 開発

### 開発フロー

1. **ブランチ作成**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **開発・テスト**
   ```bash
   # コード実装
   # テスト作成・実行
   pnpm test
   pnpm run format
   ```

3. **プルリクエスト作成**
   - テンプレートに従って記入
   - レビュアーを指定
   - 関連するIssueをリンク

### コーディング規約

詳細なコーディング規約については、以下のドキュメントを参照してください：

- [コーディング規約](CODING_STANDARDS.md)
- [アーキテクチャガイド](ARCHITECTURE_GUIDE.md)
- [開発ガイド](DEVELOPMENT_GUIDE.md)

### 主要コマンド

```bash
# 開発サーバー起動
pnpm start

# ビルド
pnpm build

# テスト実行
pnpm test

# テスト（UI付き）
pnpm test:ui

# テスト（1回のみ）
pnpm test:run

# コードフォーマット
pnpm run format

# フォーマットチェック
pnpm run format:check
```

### ディレクトリ構造

```
frontend/
├── public/                    # 静的ファイル
├── src/
│   ├── features/             # 機能モジュール
│   │   ├── tasks/
│   │   │   ├── components/   # タスク専用コンポーネント
│   │   │   ├── hooks/        # useTasks, useTaskFilters
│   │   │   ├── api/          # tasksApi
│   │   │   ├── types.ts      # タスク機能固有の型
│   │   │   └── index.ts      # 公開API
│   │   ├── categories/
│   │   │   ├── components/   # カテゴリ専用コンポーネント
│   │   │   ├── hooks/        # useCategories, useCategoryMutations
│   │   │   ├── api/          # categoriesApi
│   │   │   └── index.ts      # 公開API
│   │   ├── routineTasks/
│   │   │   ├── components/   # 習慣化タスク専用コンポーネント
│   │   │   ├── hooks/        # useRoutineTasks, useTaskGeneration
│   │   │   ├── api/          # routineTasksApi
│   │   │   └── index.ts      # 公開API
│   │   ├── milestones/
│   │   │   ├── components/   # マイルストーン専用コンポーネント
│   │   │   ├── hooks/        # useMilestones, useMilestoneMutations
│   │   │   ├── api/          # milestonesApi
│   │   │   └── index.ts      # 公開API
│   │   └── auth/
│   ├── shared/               # 共通モジュール
│   │   ├── components/       # Button, Modal等
│   │   ├── hooks/            # useApi, useNotification
│   │   ├── utils/
│   │   └── types/
│   ├── lib/                  # 外部ライブラリラッパー
│   │   ├── axios.ts
│   │   └── mantine.ts
│   ├── pages/                # ルートコンポーネント
│   │   ├── tasks/
│   │   ├── categories/
│   │   ├── routineTasks/
│   │   └── milestones/
│   ├── types/                # グローバル型定義
│   │   ├── index.ts
│   │   ├── task.ts
│   │   ├── category.ts
│   │   ├── routineTask.ts
│   │   └── milestone.ts
│   ├── App.tsx
│   └── index.tsx
├── .env                      # 環境変数
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## テスト

### テストの実行

```bash
# 全テスト実行
pnpm test

# ウォッチモード
pnpm test

# UI付きテスト
pnpm test:ui

# 1回のみ実行
pnpm test:run

# カバレッジ付き
pnpm test:run -- --coverage
```

### テスト戦略

Routinify Frontendでは、以下のテスト戦略を採用しています：

- **Custom Hooks**: 必須（90%以上のカバレッジ）
- **Utils関数**: 必須（100%カバレッジ）
- **バリデーション**: 推奨（主要パスのみ）
- **UIコンポーネント**: 不要（Storybookで代替）

### テストの種類

```bash
# カスタムフックテスト
src/hooks/useTasks.test.ts

# ユーティリティ関数テスト
src/utils/taskValidation.test.ts

# 統合テスト（必要に応じて）
src/features/tasks/__tests__/integration.test.ts
```

詳細は [開発ガイド](DEVELOPMENT_GUIDE.md) を参照してください。

## ビルドとデプロイ

### プロダクションビルド

```bash
# ビルド実行
pnpm build

# ビルド結果の確認
ls -la build/

# ビルドサイズの確認
du -sh build/*
```

### デプロイ前チェック

```bash
# テスト実行
pnpm test:run

# フォーマットチェック
pnpm run format:check

# 型チェック
tsc --noEmit

# ビルド確認
pnpm build
```

### 環境別設定

- **開発環境**: `.env.development`
- **テスト環境**: `.env.test`
- **本番環境**: `.env.production`

### パフォーマンス最適化

- **コード分割**: React.lazy + Suspense
- **画像最適化**: WebP形式、遅延読み込み
- **バンドルサイズ監視**: webpack-bundle-analyzer
- **キャッシング**: Service Worker

## ドキュメント

### 開発ドキュメント

- [コーディング規約](CODING_STANDARDS.md) - コードの書き方と規約
- [アーキテクチャガイド](ARCHITECTURE_GUIDE.md) - システム設計とアーキテクチャ
- [開発ガイド](DEVELOPMENT_GUIDE.md) - 開発フローとツール

### レイヤードキュメント

- [コンポーネント層](docs/LAYER_COMPONENTS.md) - コンポーネント設計の詳細
- [カスタムフック層](docs/LAYER_HOOKS.md) - フックの実装パターン
- [型定義](docs/LAYER_TYPES.md) - 型定義の管理方法

### API仕様

- **OpenAPI仕様**: `../api/openapi.yaml`（ルートディレクトリからの相対パス）
- **Swagger UI**: http://localhost:8080（開発環境）

詳細なAPI仕様については、バックエンドの[README](../backend/README.md#api仕様)を参照してください。

## コントリビューション

### プルリクエストの作成

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'feat: Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

### コーディング規約

- [コーディング規約](CODING_STANDARDS.md)に従ってください
- ロジックには必ずテストを書いてください
- プルリクエスト前に`pnpm test`と`pnpm run format`を実行してください

### Issue報告

バグ報告や機能要求は、GitHubのIssue機能を使用してください。

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は[LICENSE](LICENSE)ファイルを参照してください。

## サポート

質問やサポートが必要な場合は、以下の方法でお問い合わせください：

- GitHub Issues: [Issues](https://github.com/your-org/routinify/issues)
- メール: support@routinify.com
- ドキュメント: [Documentation](https://docs.routinify.com)

---

**Routinify Frontend** - 直感的で高速なタスク管理UI
