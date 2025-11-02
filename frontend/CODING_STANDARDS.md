# Routinify Frontend コーディング規約

## 📋 目次

1. [概要](#概要)
2. [基本原則](#基本原則)
3. [ファイル構造とディレクトリ配置](#ファイル構造とディレクトリ配置)
4. [命名規則](#命名規則)
5. [型定義規約](#型定義規約)
6. [コンポーネント設計規約](#コンポーネント設計規約)
7. [カスタムフック規約](#カスタムフック規約)
8. [インポート規約](#インポート規約)
9. [スタイリング規約](#スタイリング規約)
10. [パフォーマンス規約](#パフォーマンス規約)
11. [テスト規約](#テスト規約)
12. [エラーハンドリング規約](#エラーハンドリング規約)
13. [Git規約](#git規約)

---

## 概要

このドキュメントは、Routinify Frontend（React + TypeScript）の開発におけるコーディング規約を定義します。
React/TypeScriptのベストプラクティスに基づき、保守性、可読性、パフォーマンスを重視した規約を定めています。

### 基本方針

本プロジェクトでは以下の方針を採用します：

- **ディレクトリ構造**: 機能単位（Feature-based）
- **型定義**: `type`で統一、ハイブリッド配置（グローバル + ローカル）
- **コンポーネント設計**: UI/ロジック完全分離（Container/Presentational）
- **カスタムフック**: 積極的にロジック分離、単一責任の原則
- **テスト戦略**: ロジック（hooks/utils）のみ、UI不要
- **パスエイリアス**: `@/`でsrc参照
- **エラーハンドリング**: 統一されたパターン

---

## 基本原則

### DRY (Don't Repeat Yourself)

重複を避け、共通ロジックは再利用可能な形で抽出する。

```typescript
// ✅ 良い例: 共通ロジックをhookに抽出
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

// 複数箇所で再利用
const debouncedSearch = useDebounce(searchTerm, 300);

// ❌ 悪い例: 同じロジックを複数箇所にコピペ
const TaskList = () => {
  const [debouncedValue, setDebouncedValue] = useState('');
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(searchTerm), 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);
};
```

### 単一責任の原則（SRP）

各コンポーネント、hooks、関数は一つの責任のみを持つ。

```typescript
// ✅ 良い例: 責務が明確
export const useFetchTasks = () => { /* データ取得のみ */ };
export const useTaskFilters = (tasks: Task[]) => { /* フィルタリングのみ */ };
export const useTaskSort = (tasks: Task[]) => { /* ソートのみ */ };

// ❌ 悪い例: 複数の責務を持つ
export const useTasks = () => {
  // データ取得 + フィルタリング + ソート + CRUD + キャッシュ + エラーハンドリング
  // 300行超えの巨大hook
};
```

### KISS (Keep It Simple, Stupid)

シンプルさを保つ。過度な抽象化は避ける。

```typescript
// ✅ 良い例: シンプルで分かりやすい
export const TaskList = ({ tasks }: { tasks: Task[] }) => {
  return (
    <div>
      {tasks.map(task => <TaskRow key={task.id} task={task} />)}
    </div>
  );
};

// ❌ 悪い例: 過度な抽象化
export const GenericList<T extends BaseEntity> = ({
  items,
  renderItem,
  keyExtractor,
  ListHeaderComponent,
  ListFooterComponent,
  onItemPress,
  // 20個以上のprops...
}: GenericListProps<T>) => { /* 複雑な実装 */ };
```

---

## ファイル構造とディレクトリ配置

### ディレクトリ構造（機能単位）

```
src/
├── features/                      # 機能モジュール
│   ├── tasks/
│   │   ├── components/            # タスク専用コンポーネント
│   │   │   ├── TaskList/
│   │   │   │   ├── TaskList.tsx          # Presentational
│   │   │   │   ├── TaskListContainer.tsx # Container
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── hooks/                 # タスク専用hooks
│   │   │   ├── useFetchTasks.ts
│   │   │   ├── useFetchTasks.test.ts
│   │   │   ├── useTaskFilters.ts
│   │   │   └── index.ts
│   │   ├── api/                   # API層
│   │   │   └── tasksApi.ts
│   │   ├── utils/                 # ユーティリティ
│   │   │   ├── taskValidation.ts
│   │   │   └── taskValidation.test.ts
│   │   ├── types.ts               # 機能固有の型
│   │   └── index.ts               # 公開API
│   ├── categories/
│   └── auth/
│
├── shared/                        # 共通モジュール
│   ├── components/                # 共通コンポーネント
│   │   ├── Button/
│   │   ├── Modal/
│   │   └── Layout/
│   ├── hooks/                     # 共通hooks
│   │   ├── useApi.ts
│   │   ├── useNotification.ts
│   │   └── useDebounce.ts
│   ├── utils/                     # 共通ユーティリティ
│   │   ├── date.ts
│   │   └── validation.ts
│   └── types/                     # 共通型
│       └── common.ts
│
├── lib/                           # 外部ライブラリラッパー
│   ├── axios.ts
│   ├── mantine.ts
│   └── auth0.ts
│
├── pages/                         # ルーティング専用
│   ├── TasksPage.tsx
│   ├── CategoriesPage.tsx
│   └── index.ts
│
├── types/                         # グローバル型定義
│   ├── index.ts
│   ├── task.ts
│   ├── category.ts
│   └── api.ts
│
├── App.tsx
├── index.tsx
└── env.d.ts
```

### ファイル配置ルール

#### **機能別配置の判断基準**

**features/ に配置**:
- タスク管理専用のコンポーネント（TaskList, TaskForm）
- タスク管理専用のhooks（useTasks, useTaskFilters）
- タスク管理専用のAPI（tasksApi）

**shared/ に配置**:
- 複数機能で使用するコンポーネント（Button, Modal, Layout）
- 複数機能で使用するhooks（useDebounce, useLocalStorage）
- 複数機能で使用するユーティリティ（date.ts, validation.ts）

---

## 命名規則

### ファイル名

```typescript
// ✅ コンポーネント: PascalCase
TaskList.tsx
UserProfile.tsx
CategoryModal.tsx

// ✅ hooks: camelCase（useプレフィックス）
useTasks.ts
useTaskFilters.ts
useDebounce.ts

// ✅ utils, api: camelCase
taskValidation.ts
formatDate.ts
tasksApi.ts

// ✅ 型定義: camelCase
task.ts
category.ts
api.ts

// ❌ 悪い例
task-list.tsx        // kebab-case不可
TaskList.js          // .js不可（.tsxを使用）
use-tasks.ts         // kebab-case不可
```

### コンポーネント名

```typescript
// ✅ 良い例: PascalCase、名詞
export const TaskList = () => { /* ... */ };
export const UserProfile = () => { /* ... */ };
export const CategoryModal = () => { /* ... */ };

// ✅ Container suffix
export const TaskListContainer = () => { /* ... */ };

// ❌ 悪い例
export const taskList = () => { /* ... */ };        // camelCase不可
export const task_list = () => { /* ... */ };       // snake_case不可
export const ShowTasks = () => { /* ... */ };       // 動詞不可
```

### 変数・関数名

```typescript
// ✅ 良い例: camelCase
const taskList = useTasks();
const filteredTasks = tasks.filter(/* ... */);
const isLoading = loadingState === 'fetching';
const hasError = error !== null;

// ✅ イベントハンドラ: handleXxx形式
const handleSubmit = () => { /* ... */ };
const handleTaskCreate = (data: CreateTaskDto) => { /* ... */ };
const handleSearchChange = (term: string) => { /* ... */ };

// ✅ Boolean変数: is/has/can/shouldプレフィックス
const isVisible = true;
const hasPermission = checkPermission();
const canEdit = user.role === 'admin';
const shouldRender = isVisible && hasData;

// ❌ 悪い例
const TaskList = useTasks();                // PascalCase不可（変数）
const submitHandler = () => { /* ... */ };  // xxxHandler形式不可
const visible = true;                        // isプレフィックスなし
```

### Custom Hooks名

```typescript
// ✅ 良い例: useプレフィックス + 用途明確
export const useTasks = () => { /* ... */ };
export const useFetchTasks = () => { /* ... */ };
export const useTaskFilters = (tasks: Task[]) => { /* ... */ };
export const useTaskForm = (onSubmit) => { /* ... */ };
export const useDebounce = <T>(value: T, delay: number) => { /* ... */ };

// ❌ 悪い例
export const getTasks = () => { /* ... */ };        // useプレフィックスなし
export const useData = () => { /* ... */ };         // 汎用的すぎる
export const useTasksAndCategories = () => { /* ... */ }; // 複数責務
```

### 型名

```typescript
// ✅ 良い例: PascalCase
export type Task = { /* ... */ };
export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type CreateTaskDto = Omit<Task, 'id'>;
export type TaskListProps = { /* ... */ };

// ✅ Props型: ComponentName + Props
export type TaskListProps = { /* ... */ };
export type TaskFormProps = { /* ... */ };

// ✅ DTO型: Entity + Dto
export type CreateTaskDto = { /* ... */ };
export type UpdateTaskDto = { /* ... */ };

// ❌ 悪い例
export type taskType = { /* ... */ };       // camelCase不可
export type ITask = { /* ... */ };          // Iプレフィックス不可（C#スタイル）
export type TaskInterface = { /* ... */ };  // Interface suffix不可
```

### 定数名

```typescript
// ✅ 良い例: SCREAMING_SNAKE_CASE
export const MAX_TASK_TITLE_LENGTH = 255;
export const API_BASE_URL = 'http://localhost:3000';
export const DEFAULT_PAGE_SIZE = 20;

export const TASK_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const;

// ❌ 悪い例
export const maxTaskTitleLength = 255;      // camelCase不可
export const ApiBaseUrl = 'http://...';     // PascalCase不可
```

---

## 型定義規約

### データ形式の規約

**重要**: バックエンドからは**キャメルケース（camelCase）**の状態でデータが返されます。

- **APIレスポンス**: camelCase（`accountId`, `dueDate`, `createdAt`など）

フロントエンド側の型定義も、バックエンドのレスポンス形式に合わせて**キャメルケース**で記述します。

### typeで統一

**理由**:
- パフォーマンス（微小だが高速）
- Union/Intersection型の表現力
- Mapped Typesとの親和性
- 意図しない拡張の防止

```typescript
// ✅ 良い例: typeを使用、キャメルケースで記述
export type Task = {
  readonly id: number;
  accountId: string;        // camelCase（バックエンドのレスポンス形式に合わせる）
  title: string;
  dueDate: string | null;   // camelCase
  status: TaskStatus | null;
  priority: TaskPriority | null;
  categoryId: number | null; // camelCase
  createdAt: string;        // camelCase
  updatedAt: string;        // camelCase
};

export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type TaskWithCategory = Task & { category: Category };

// ❌ 悪い例: interfaceは使用しない
export interface Task {  // interface不可
  id: number;
  title: string;
}

// ❌ 悪い例: snake_caseで型定義している（バックエンドレスポンスと不一致）
export type Task = {
  account_id: string;    // ❌ snake_case不可
  due_date: string;      // ❌ snake_case不可
  created_at: string;    // ❌ snake_case不可
};
```

### 型定義の配置（ハイブリッド方式）

#### **グローバル型（types/）に配置**
- ドメインモデル: Task, Category, User
- API共通型: ApiResponse<T>, ApiError
- 共通ユーティリティ型

```typescript
// types/task.ts
export type Task = {
  readonly id: number;
  accountId: string;
  title: string;
  status: TaskStatus | null;
  // ...
};

export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type CreateTaskDto = Omit<Task, 'id' | 'accountId' | 'createdAt' | 'updatedAt'>;
```

#### **ローカル型（features/内）に配置**
- コンポーネントProps
- フォームデータ型
- 機能内部でのみ使用する型

```typescript
// features/tasks/types.ts
export type TaskFilterState = {
  searchTerm: string;
  selectedCategory: number | null;
};

export type TaskSortState = {
  key: TaskSortKey | null;
  direction: 'asc' | 'desc';
};

// features/tasks/components/TaskList/TaskList.tsx
export type TaskListProps = {
  tasks: Task[];
  isLoading: boolean;
  onSearchChange: (term: string) => void;
};
```

### 型定義のスタイル

```typescript
// ✅ 良い例: 明確な型定義
export type Task = {
  readonly id: number;              // 不変プロパティはreadonly
  title: string;
  description?: string;             // オプショナルは?
  categoryId: number | null;        // nullableはunion
  status: TaskStatus | null;
  readonly createdAt: string;
};

// ✅ Union型
export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// ✅ Utility Types活用
export type CreateTaskDto = Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'accountId'>;
export type UpdateTaskDto = Partial<CreateTaskDto>;
export type TaskKeys = keyof Task;
export type TaskSortKey = Extract<TaskKeys, 'createdAt' | 'dueDate' | 'priority'>;

// ❌ 悪い例
export type Task = {
  id: number | undefined;           // undefined不可（null使用）
  title: string | null | undefined; // union乱用
};
```

### 定数と型の連携

```typescript
// ✅ 良い例: 定数から型を生成
export const TASK_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const;

export type TaskStatus = typeof TASK_STATUS[keyof typeof TASK_STATUS];

// 使用例
if (task.status === TASK_STATUS.PENDING) { /* ... */ }

// ❌ 悪い例: 定数と型が分離
export const TASK_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
};

export type TaskStatus = 'pending' | 'in_progress';  // 手動同期が必要
```

---

## コンポーネント設計規約

### Container/Presentational パターン

**必須**: すべてのコンポーネントでこのパターンを適用

#### **Presentational Component（UI層）**

```typescript
// ✅ 良い例: propsのみ、ロジックなし
export type TaskListProps = {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onTaskCreate: (data: CreateTaskDto) => void;
};

export const TaskList = ({
  tasks,
  isLoading,
  error,
  searchTerm,
  onSearchChange,
  onTaskCreate,
}: TaskListProps) => {
  if (isLoading) return <Loader />;
  if (error) return <Alert color="red">{error}</Alert>;

  return (
    <Container>
      <Title>タスク一覧</Title>
      <TextInput
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      {tasks.map(task => (
        <TaskRow key={task.id} task={task} />
      ))}
      <Button onClick={() => onTaskCreate({ title: 'New Task' })}>
        タスク追加
      </Button>
    </Container>
  );
};

// ❌ 悪い例: ロジックが混在
export const TaskList = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTasks();  // ロジックがPresentational内にある
  }, []);

  const fetchTasks = async () => { /* ... */ };

  return <div>{/* ... */}</div>;
};
```

#### **Container Component（ロジック層）**

```typescript
// ✅ 良い例: ロジックのみ、UIなし
export const TaskListContainer = () => {
  const { data: tasks, loading, error } = useFetchTasks();
  const { filteredTasks, searchTerm, setSearchTerm } = useTaskFilters(tasks);
  const { sortedTasks, sortKey, setSortKey } = useTaskSort(filteredTasks);
  const { createTask } = useTaskMutations();

  const handleCreate = async (data: CreateTaskDto) => {
    await createTask(data);
  };

  return (
    <TaskList
      tasks={sortedTasks}
      isLoading={loading}
      error={error}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onTaskCreate={handleCreate}
    />
  );
};

// ❌ 悪い例: UIが混在
export const TaskListContainer = () => {
  const { data } = useFetchTasks();

  return (
    <div>
      <h1>タスク一覧</h1>  {/* UIがContainer内にある */}
      <TaskList tasks={data} />
    </div>
  );
};
```

### コンポーネントのサイズ

```typescript
// ✅ 良い例: 小さいコンポーネント（50行以内）
export const TaskRow = ({ task }: { task: Task }) => {
  return (
    <tr>
      <td>{task.title}</td>
      <td>{task.status}</td>
      <td>{task.priority}</td>
    </tr>
  );
};

// ❌ 悪い例: 巨大コンポーネント（300行超え）
export const TaskList = () => {
  // 100行のstate定義
  // 100行のuseEffect
  // 100行のJSX
};
```

### Props の型定義

```typescript
// ✅ 良い例: 明確なProps型
export type TaskListProps = {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  onSearchChange: (term: string) => void;
};

export const TaskList = (props: TaskListProps) => { /* ... */ };

// または分割代入
export const TaskList = ({ tasks, isLoading, error, onSearchChange }: TaskListProps) => {
  // ...
};

// ❌ 悪い例: インラインの型定義
export const TaskList = ({ tasks, isLoading }: {
  tasks: Task[];
  isLoading: boolean
}) => { /* ... */ };
```

---

## カスタムフック規約

### 単一責任の原則

```typescript
// ✅ 良い例: 1つのhookは1つの責務
export const useFetchTasks = () => {
  // データ取得のみ
};

export const useTaskFilters = (tasks: Task[]) => {
  // フィルタリングのみ
};

export const useTaskSort = (tasks: Task[]) => {
  // ソートのみ
};

// ❌ 悪い例: 複数の責務
export const useTasks = () => {
  // データ取得 + フィルタリング + ソート + CRUD + キャッシュ
  // 300行超えの巨大hook
};
```

### Hooksの命名規則

```typescript
// ✅ 良い例: useプレフィックス + 用途明確
export const useFetchTasks = () => { /* データ取得 */ };
export const useTaskFilters = (tasks) => { /* フィルタリング */ };
export const useTaskForm = (onSubmit) => { /* フォーム管理 */ };
export const useDebounce = <T>(value: T, delay: number) => { /* デバウンス */ };

// ❌ 悪い例
export const getTasks = () => { /* useプレフィックスなし */ };
export const useData = () => { /* 汎用的すぎる */ };
```

### Hooksの戻り値

```typescript
// ✅ 良い例: オブジェクトで戻り値を返す（名前でアクセス）
export const useFetchTasks = () => {
  return { data, loading, error, refetch };
};

const { data, loading } = useFetchTasks();

// ✅ 良い例: 単一の値を返す場合は直接返す
export const useDebounce = <T>(value: T, delay: number): T => {
  return debouncedValue;
};

const debouncedSearch = useDebounce(searchTerm, 300);

// ❌ 悪い例: 配列で返す（順序依存）
export const useFetchTasks = () => {
  return [data, loading, error, refetch];
};

const [data, loading, error, refetch] = useFetchTasks();  // 順序を覚える必要がある
```

### Hooksの依存配列

```typescript
// ✅ 良い例: 必要な依存のみ
useEffect(() => {
  fetchTasks();
}, []);  // 初回のみ実行

useEffect(() => {
  filterTasks(searchTerm);
}, [searchTerm]);  // searchTermが変更されたら実行

// ✅ useCallbackの適切な使用
const handleSubmit = useCallback((data: CreateTaskDto) => {
  createTask(data);
}, [createTask]);

// ❌ 悪い例: 依存配列の警告を無視
useEffect(() => {
  fetchTasks(userId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);  // userIdを依存配列に含めるべき
```

---

## インポート規約

### インポート順序

```typescript
// 1. React関連
import React, { useState, useEffect, useCallback } from 'react';

// 2. 外部ライブラリ（UI）
import { Container, Button, TextInput, Loader, Alert } from '@mantine/core';
import { IconPlus, IconSearch } from '@tabler/icons-react';

// 3. 内部モジュール（絶対パス）
import { useTasks } from '@/features/tasks/hooks';
import { Task, CreateTaskDto } from '@/types';
import { COLORS } from '@/shared/constants';

// 4. 相対パス（同階層・下層のみ）
import { TaskRow } from './TaskRow';
import { TaskForm } from './TaskForm';
import type { TaskListProps } from './types';
```

### パスエイリアス

```typescript
// ✅ 良い例: @/を使用
import { useTasks } from '@/features/tasks/hooks';
import { Task } from '@/types';
import { COLORS } from '@/shared/constants';

// ✅ 相対パスは同階層・下層のみ
import { TaskRow } from './TaskRow';
import { columns } from './columns';

// ❌ 悪い例: 深いネストの相対パス
import { COLORS } from '../../../shared/constants';
import { Task } from '../../../../types/task';
```

### Named Import vs Default Import

```typescript
// ✅ 良い例: Named Importを優先
export const TaskList = () => { /* ... */ };
import { TaskList } from '@/features/tasks';

// ✅ Default Importは pages のみ
export default TasksPage;
import TasksPage from '@/pages/TasksPage';

// ❌ 悪い例: 不必要なDefault Import
export default TaskList;  // Named Exportを使用すべき
```

---

## スタイリング規約

### Mantine UIの使用

```typescript
// ✅ 良い例: Mantineコンポーネントを使用
import { Container, Button, TextInput } from '@mantine/core';

export const TaskForm = () => {
  return (
    <Container>
      <TextInput label="タスク名" />
      <Button color="blue">送信</Button>
    </Container>
  );
};

// ❌ 悪い例: 生のHTML要素
export const TaskForm = () => {
  return (
    <div className="container">
      <input type="text" />
      <button>送信</button>
    </div>
  );
};
```

### スタイルの定義

```typescript
// ✅ 良い例: インラインスタイル（動的）
<Box style={{ backgroundColor: isActive ? 'blue' : 'gray' }} />

// ✅ Mantineのstylesプロパティ
<TextInput
  styles={{
    input: {
      borderColor: COLORS.PRIMARY,
      '&:focus': {
        borderColor: COLORS.DARK,
      },
    },
  }}
/>

// ❌ 悪い例: CSSクラス（避ける）
<div className="custom-box" />  // 避ける
```

---

## パフォーマンス規約

### メモ化の基準

#### **useCallbackを使用すべきケース**

```typescript
// ✅ 必要: 子コンポーネントにpropsとして渡す関数
const handleEdit = useCallback((id: number) => {
  updateTask(id);
}, [updateTask]);

<TaskRow onEdit={handleEdit} />  // 子コンポーネントに渡す

// ❌ 不要: イベントハンドラーのみ
const handleClick = useCallback(() => {
  console.log('clicked');
}, []);  // 過剰最適化
```

#### **useMemoを使用すべきケース**

```typescript
// ✅ 必要: 重い計算処理
const expensiveValue = useMemo(() => {
  return tasks.map(task => {
    // 複雑な変換処理
  });
}, [tasks]);

// ❌ 不要: 軽い計算
const count = useMemo(() => tasks.length, [tasks]);  // 過剰最適化
```

### リストのレンダリング

```typescript
// ✅ 良い例: keyにidを使用
{tasks.map(task => (
  <TaskRow key={task.id} task={task} />
))}

// ❌ 悪い例: keyにindexを使用
{tasks.map((task, index) => (
  <TaskRow key={index} task={task} />
))}
```

---

## テスト規約

### テスト対象

**✅ テスト必須**:
- Custom Hooks（ビジネスロジック）: 90%以上カバレッジ
- Utils関数（純粋関数）: 100%カバレッジ
- バリデーション: 主要パスのみ

**❌ テスト不要**:
- UIコンポーネント（Storybookで代替）
- 型定義
- 定数

### Custom Hooksのテスト

```typescript
// hooks/useTasks.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useTasks } from './useTasks';
import { tasksApi } from '../api/tasksApi';

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

    expect(result.current.loading).toBe(true);

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

### ユーティリティ関数のテスト

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
});
```

---

## エラーハンドリング規約

### 統一されたエラー通知

```typescript
// ✅ 良い例: 統一された通知システム
// shared/hooks/useNotification.ts
export const useNotification = () => {
  const showError = (message: string) => {
    notifications.show({
      title: 'エラー',
      message,
      color: 'red',
    });
  };

  const showSuccess = (message: string) => {
    notifications.show({
      title: '成功',
      message,
      color: 'green',
    });
  };

  return { showError, showSuccess };
};

// 使用例
const { showError } = useNotification();

try {
  await createTask(data);
} catch (error) {
  showError('タスクの作成に失敗しました');
}

// ❌ 悪い例: console.errorやalertの使用
try {
  await createTask(data);
} catch (error) {
  console.error(error);  // 不可
  alert('エラーが発生しました');  // 不可
}
```

### 確認ダイアログの統一

```typescript
// ✅ 良い例: 統一されたダイアログ
// shared/utils/dialog.ts
export const confirmDialog = {
  delete: (itemName: string) =>
    window.confirm(`${itemName}を削除してもよろしいですか？`),

  discard: () =>
    window.confirm('変更を破棄してもよろしいですか？'),
};

// 使用例
if (confirmDialog.delete('タスク')) {
  await deleteTask(id);
}

// ❌ 悪い例: 個別にwindow.confirm
if (window.confirm('このタスクを削除してもよろしいですか？\n関連データも削除されます。')) {
  await deleteTask(id);
}
```

---

## Git規約

### コミットメッセージ

```
# ✅ 良い例
feat: タスク一覧画面にフィルタリング機能を追加
fix: タスク作成時のバリデーションエラーを修正
docs: READMEにセットアップ手順を追加
refactor: TaskListコンポーネントをContainer/Presentationalに分離
test: useTasksフックのテストを追加
style: ESLintエラーを修正

# ❌ 悪い例
update
fix
changes
work
```

### ブランチ命名

```
# ✅ 良い例
feature/task-filtering
fix/task-validation
refactor/task-list-component
docs/architecture-guide

# ❌ 悪い例
new-feature
fix
update
work
```

---

## まとめ

このコーディング規約に従うことで、以下の効果が期待できます：

- **保守性の向上**: 一貫したコードスタイルにより、理解しやすいコード
- **品質の向上**: ベストプラクティスに基づく堅牢な実装
- **開発効率の向上**: 明確な規約により、迷いのない開発
- **チーム開発の円滑化**: 統一された規約による協力の促進

規約は定期的に見直し、プロジェクトの成長に合わせて更新していきます。
