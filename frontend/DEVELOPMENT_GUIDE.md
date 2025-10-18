# Routinify Frontend 開発ガイド

## 📋 目次

1. [開発環境セットアップ](#開発環境セットアップ)
2. [開発フロー](#開発フロー)
3. [コーディング規約](#コーディング規約)
4. [テスト戦略](#テスト戦略)
5. [デバッグとログ](#デバッグとログ)
6. [パフォーマンス監視](#パフォーマンス監視)
7. [ビルドとデプロイ](#ビルドとデプロイ)

---

## 開発環境セットアップ

### 必要な環境

- Node.js 18+
- pnpm 8+ (または npm/yarn)
- Docker & Docker Compose（推奨）
- VS Code（推奨エディタ）

### セットアップ手順

```bash
# 1. リポジトリのクローン
git clone <repository-url>
cd Routinify/frontend

# 2. 依存関係のインストール
pnpm install

# 3. 環境変数の設定
cp .env.example .env
# .envファイルを編集

# 4. 開発サーバーの起動
pnpm start
```

### 環境変数の設定

```env
# .env
REACT_APP_AUTH0_DOMAIN=dev-x7dol3ce1bkdedsn.jp.auth0.com
REACT_APP_AUTH0_CLIENT_ID=your-client-id
REACT_APP_AUTH0_AUDIENCE=https://Routinify-auth-api.com
REACT_APP_API_URL=http://localhost:3000
```

### Docker環境での開発

```bash
# ルートディレクトリから開発環境全体を起動
cd ../
make up

# フロントエンドのログ確認
make logs

# フロントエンドのみ再起動
docker-compose restart frontend

# コンテナ内でコマンド実行
docker-compose exec frontend sh
docker-compose exec frontend pnpm test
```

### VS Code推奨設定

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

### VS Code推奨拡張機能

```json
// .vscode/extensions.json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "dsznajder.es7-react-js-snippets",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

---

## 開発フロー

### 1. ブランチ戦略

```bash
# メインブランチ
main                    # 本番環境
develop                 # 開発環境

# 機能ブランチ
feature/task-filtering
feature/category-management
feature/user-settings

# 修正ブランチ
fix/task-validation
fix/memory-leak

# リファクタリングブランチ
refactor/task-list-component
refactor/hooks-separation

# ドキュメントブランチ
docs/architecture-guide
docs/api-documentation
```

### 2. 開発の流れ

#### **Step 1: ブランチ作成**
```bash
git checkout -b feature/task-filtering
```

#### **Step 2: 開発**
```bash
# コード実装
# テスト作成
pnpm test

# フォーマット
pnpm run format

# 型チェック
tsc --noEmit
```

#### **Step 3: コミット**
```bash
git add .
git commit -m "feat: タスク一覧にフィルタリング機能を追加"
```

#### **Step 4: プッシュとPR作成**
```bash
git push origin feature/task-filtering
# GitHub上でPR作成
```

#### **Step 5: コードレビュー**
- レビュアーによるチェック
- 必要に応じて修正

#### **Step 6: マージ**
- 承認後、developブランチにマージ
- ブランチの削除

### 3. コミット規約

```bash
# コミットメッセージの形式
<type>(<scope>): <description>

# 例
feat(tasks): タスク一覧にフィルタリング機能を追加
fix(validation): タスク作成時のバリデーションエラーを修正
docs(readme): セットアップ手順を更新
refactor(hooks): useTasksをuseFetchTasksとuseTaskFiltersに分離
test(useTasks): useTasksフックのテストを追加
style(eslint): ESLintエラーを修正

# タイプ一覧
feat:     新機能
fix:      バグ修正
docs:     ドキュメント
style:    コードスタイル（フォーマット等）
refactor: リファクタリング
test:     テスト
chore:    ビルドプロセス、依存関係等
```

### 4. プルリクエストテンプレート

```markdown
## 概要
<!-- このPRで何を変更したか -->

## 変更内容
- [ ] 新機能の追加
- [ ] バグ修正
- [ ] リファクタリング
- [ ] ドキュメント更新

## スクリーンショット
<!-- UIの変更がある場合 -->

## テスト
- [ ] 既存のテストが通る
- [ ] 新しいテストを追加した（ロジック変更の場合）

## チェックリスト
- [ ] コーディング規約に従っている
- [ ] テストを実行した（pnpm test）
- [ ] フォーマットを実行した（pnpm run format）
- [ ] 型チェックが通る（tsc --noEmit）

## 関連Issue
<!-- Issue番号を記載 -->
Closes #123
```

---

## コーディング規約

### 1. ESLint/Prettierの実行

```bash
# ESLintチェック（今後追加予定）
pnpm run lint

# Prettierフォーマット
pnpm run format

# フォーマットチェック
pnpm run format:check

# 型チェック
tsc --noEmit
```

### 2. コードフォーマット

```typescript
// ✅ 良い例: Prettierでフォーマット済み
export const TaskList = ({ tasks, onEdit }: TaskListProps) => {
  return (
    <Container>
      {tasks.map((task) => (
        <TaskRow key={task.id} task={task} onEdit={onEdit} />
      ))}
    </Container>
  );
};

// ❌ 悪い例: フォーマットされていない
export const TaskList = ({tasks, onEdit}: TaskListProps) => {
return (<Container>{tasks.map(task => <TaskRow key={task.id} task={task} onEdit={onEdit} />)}</Container>);
};
```

### 3. 命名規則

```typescript
// コンポーネント: PascalCase
export const TaskList = () => { /* ... */ };

// hooks: camelCase + useプレフィックス
export const useTasks = () => { /* ... */ };

// 変数・関数: camelCase
const taskList = useTasks();
const handleSubmit = () => { /* ... */ };

// 定数: SCREAMING_SNAKE_CASE
export const MAX_TASK_TITLE_LENGTH = 255;

// 型: PascalCase
export type Task = { /* ... */ };
export type TaskListProps = { /* ... */ };
```

---

## テスト戦略

### 1. テストの種類と優先度

**🔴 必須（カバレッジ90%以上）**:
- Custom Hooks（ビジネスロジック）
- Utils関数（純粋関数）

**🟡 推奨（主要パスのみ）**:
- バリデーション関数
- 複雑な計算処理

**⚪ 不要**:
- UIコンポーネント（Storybookで代替）
- 型定義
- 定数

### 2. Custom Hooksのテスト

```typescript
// hooks/useTasks.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useTasks } from './useTasks';
import { tasksApi } from '../api/tasksApi';

// モック
vi.mock('../api/tasksApi');

describe('useTasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('初期状態でタスクを取得する', async () => {
    const mockTasks = [
      { id: 1, title: 'Task 1', status: 'pending' },
      { id: 2, title: 'Task 2', status: 'completed' },
    ];
    vi.mocked(tasksApi.getAll).mockResolvedValue({ data: mockTasks });

    const { result } = renderHook(() => useTasks());

    // ローディング状態
    expect(result.current.loading).toBe(true);

    // データ取得完了
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.tasks).toEqual(mockTasks);
    expect(tasksApi.getAll).toHaveBeenCalledTimes(1);
  });

  it('エラー時にエラーメッセージを返す', async () => {
    const mockError = new Error('Network error');
    vi.mocked(tasksApi.getAll).mockRejectedValue(mockError);

    const { result } = renderHook(() => useTasks());

    await waitFor(() => {
      expect(result.current.error).toBe('タスクの取得に失敗しました');
    });
  });
});
```

### 3. Utils関数のテスト

```typescript
// utils/taskValidation.test.ts
import { validateTask } from './taskValidation';

describe('validateTask', () => {
  it('有効なタスクデータの場合、エラーなし', () => {
    const validTask = {
      title: 'Valid Task',
      status: 'pending' as const,
    };

    const errors = validateTask(validTask);

    expect(errors).toEqual({});
  });

  it('タイトルが空の場合、エラーを返す', () => {
    const invalidTask = {
      title: '',
      status: 'pending' as const,
    };

    const errors = validateTask(invalidTask);

    expect(errors.title).toBe('タイトルは必須です');
  });

  it('タイトルが100文字超の場合、エラーを返す', () => {
    const invalidTask = {
      title: 'a'.repeat(101),
      status: 'pending' as const,
    };

    const errors = validateTask(invalidTask);

    expect(errors.title).toBe('タイトルは100文字以内で入力してください');
  });
});
```

### 4. テスト実行

```bash
# 全テスト実行（ウォッチモード）
pnpm test

# 1回のみ実行
pnpm test:run

# UI付きテスト
pnpm test:ui

# カバレッジ付き
pnpm test:run -- --coverage

# 特定のファイル
pnpm test useTasks.test.ts

# 特定のテストのみ
pnpm test useTasks.test.ts -t "初期状態でタスクを取得する"
```

### 5. テストデータ管理

```typescript
// test/fixtures/tasks.ts
export const mockTasks = [
  {
    id: 1,
    title: 'Task 1',
    status: 'pending' as const,
    priority: 'high' as const,
    dueDate: '2024-12-31',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 2,
    title: 'Task 2',
    status: 'completed' as const,
    priority: 'low' as const,
    dueDate: null,
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
];

// 使用例
import { mockTasks } from '../test/fixtures/tasks';

it('タスクをフィルタリングできる', () => {
  const { filteredTasks } = useTaskFilters(mockTasks);
  expect(filteredTasks).toHaveLength(2);
});
```

---

## デバッグとログ

### 1. React Developer Tools

```bash
# Chromeにインストール
https://chrome.google.com/webstore/detail/react-developer-tools
```

**使用方法**:
- Componentsタブ: コンポーネントツリー表示
- Profilerタブ: パフォーマンス測定

### 2. console.log の使用

```typescript
// ✅ 開発時のデバッグ
const TaskList = ({ tasks }: TaskListProps) => {
  console.log('TaskList rendered with tasks:', tasks);

  useEffect(() => {
    console.log('Tasks updated:', tasks);
  }, [tasks]);

  return <div>{/* ... */}</div>;
};

// ⚠️ 本番環境では削除すること
```

### 3. React Errorエラーバウンダリ

```typescript
// shared/components/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert color="red">
          <h2>エラーが発生しました</h2>
          <p>{this.state.error?.message}</p>
        </Alert>
      );
    }

    return this.props.children;
  }
}

// 使用例
<ErrorBoundary>
  <TaskList />
</ErrorBoundary>
```

### 4. Network監視

```typescript
// lib/axios.ts
import axios from 'axios';

// リクエストインターセプター（ログ出力）
axios.interceptors.request.use((config) => {
  console.log('Request:', config.method?.toUpperCase(), config.url);
  return config;
});

// レスポンスインターセプター（ログ出力）
axios.interceptors.response.use(
  (response) => {
    console.log('Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('Response Error:', error.response?.status, error.config.url);
    return Promise.reject(error);
  }
);
```

---

## パフォーマンス監視

### 1. React Profiler

```typescript
// パフォーマンス測定
import { Profiler } from 'react';

const onRenderCallback = (
  id: string,
  phase: 'mount' | 'update',
  actualDuration: number,
  baseDuration: number,
  startTime: number,
  commitTime: number
) => {
  console.log(`${id} (${phase}) took ${actualDuration}ms`);
};

<Profiler id="TaskList" onRender={onRenderCallback}>
  <TaskList />
</Profiler>
```

### 2. メモリリークの検出

```typescript
// ✅ 良い例: クリーンアップ
useEffect(() => {
  const interval = setInterval(() => {
    fetchTasks();
  }, 5000);

  return () => clearInterval(interval);  // クリーンアップ
}, []);

// ❌ 悪い例: クリーンアップなし
useEffect(() => {
  setInterval(() => {
    fetchTasks();
  }, 5000);  // メモリリーク
}, []);
```

### 3. バンドルサイズ分析

```bash
# webpack-bundle-analyzerをインストール
pnpm add -D webpack-bundle-analyzer

# ビルド後に分析
pnpm build
# analyze スクリプトを追加して実行
```

### 4. Lighthouse監査

```bash
# Chrome DevTools > Lighthouse
# パフォーマンス、アクセシビリティ、SEO等を測定
```

---

## ビルドとデプロイ

### 1. プロダクションビルド

```bash
# ビルド実行
pnpm build

# ビルド結果の確認
ls -la build/

# ビルドサイズの確認
du -sh build/*
```

### 2. デプロイ前チェックリスト

```bash
# ✅ テスト実行
pnpm test:run

# ✅ フォーマットチェック
pnpm run format:check

# ✅ 型チェック
tsc --noEmit

# ✅ ビルド確認
pnpm build

# ✅ 環境変数確認
# .env.production の設定を確認

# ✅ エラーログ確認
# console.log等の開発用コードを削除
```

### 3. 環境別設定

```env
# .env.development
REACT_APP_API_URL=http://localhost:3000

# .env.production
REACT_APP_API_URL=https://api.routinify.com
```

### 4. デプロイ手順（例：Vercel）

```bash
# Vercelにデプロイ
vercel

# 本番環境にデプロイ
vercel --prod
```

### 5. パフォーマンス最適化

```typescript
// ✅ コード分割（React.lazy）
const TaskList = React.lazy(() => import('./features/tasks/components/TaskList'));

<Suspense fallback={<Loader />}>
  <TaskList />
</Suspense>

// ✅ 画像最適化
<img
  src="/images/logo.webp"
  loading="lazy"
  alt="Logo"
/>

// ✅ Service Workerによるキャッシング
// public/service-worker.js
```

---

## まとめ

この開発ガイドに従うことで、以下の効果が期待できます：

- **開発効率の向上**: 統一されたフローとツールによる効率的な開発
- **品質の向上**: テストとコードレビューによる品質保証
- **保守性の向上**: 一貫したコーディング規約による理解しやすいコード
- **パフォーマンスの最適化**: 適切な監視と最適化手法

このガイドは、チームの成長とプロジェクトの進化に合わせて継続的に更新していきます。
