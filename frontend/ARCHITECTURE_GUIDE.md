# Routinify Frontend アーキテクチャガイド

## 📋 目次

1. [アーキテクチャ概要](#アーキテクチャ概要)
2. [レイヤー構成](#レイヤー構成)
3. [ディレクトリ構造詳細](#ディレクトリ構造詳細)
4. [実装パターン](#実装パターン)
5. [設計原則](#設計原則)
6. [完全実装例](#完全実装例)

---

## アーキテクチャ概要

Routinify Frontendは、React + TypeScriptをベースとしたSPA（Single Page Application）です。
機能単位のディレクトリ構成（Feature-based Architecture）と、UI/ロジック分離を重視した設計となっています。

### アーキテクチャ図

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (User)                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 Routing Layer                              │
│  - React Router                                            │
│  - Protected Routes                                        │
│  - Route Configuration                                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                  Pages Layer                               │
│  - Route Components (Thin)                                 │
│  - Layout Composition                                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│            Container Component Layer                       │
│  - State Management                                        │
│  - Data Fetching                                           │
│  - Event Handling                                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│          Presentational Component Layer                   │
│  - Pure UI Components                                      │
│  - Props-driven Rendering                                  │
│  - No Business Logic                                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│               Custom Hooks Layer                           │
│  - Data Fetching Hooks (useFetchTasks)                    │
│  - Business Logic Hooks (useTaskFilters)                  │
│  - Form Management Hooks (useTaskForm)                    │
│  - Utility Hooks (useDebounce, useLocalStorage)           │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                   API Layer                                │
│  - Axios Client                                            │
│  - API Functions (tasksApi.getAll())                       │
│  - Request/Response Interceptors                           │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP/HTTPS
┌─────────────────────▼───────────────────────────────────────┐
│                Backend API (Rails)                         │
│  - RESTful Endpoints                                       │
│  - JWT Authentication                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## レイヤー構成

### 1. Pages Layer（ページ層）

**責任**: ルーティングとレイアウト構成

```typescript
// pages/TasksPage.tsx
import { TaskListContainer } from '@/features/tasks';
import { Layout } from '@/shared/components/Layout';

export const TasksPage = () => {
  return (
    <Layout>
      <TaskListContainer />
    </Layout>
  );
};
```

**特徴**:
- 非常に薄いレイヤー（5-10行程度）
- ルーティング専用
- ビジネスロジックは持たない

---

### 2. Container Component Layer（コンテナコンポーネント層）

**責任**: データ取得、状態管理、イベント処理

```typescript
// features/tasks/components/TaskList/TaskListContainer.tsx
export const TaskListContainer = () => {
  const { data: tasks, loading, error } = useFetchTasks();
  const { filteredTasks, searchTerm, setSearchTerm } = useTaskFilters(tasks);
  const { sortedTasks, sortKey, setSortKey } = useTaskSort(filteredTasks);
  const { createTask, updateTask, deleteTask } = useTaskMutations();

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
      sortKey={sortKey}
      onSortChange={setSortKey}
      onTaskCreate={handleCreate}
    />
  );
};
```

**特徴**:
- Custom Hooksを使用してロジックを取得
- Presentationalコンポーネントにpropsを渡す
- UIは持たない（`return <TaskList ... />`のみ）

---

### 3. Presentational Component Layer（プレゼンテーショナルコンポーネント層）

**責任**: UIの表示のみ

```typescript
// features/tasks/components/TaskList/TaskList.tsx
export type TaskListProps = {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  sortKey: TaskSortKey | null;
  onSortChange: (key: TaskSortKey) => void;
  onTaskCreate: (data: CreateTaskDto) => void;
};

export const TaskList = ({
  tasks,
  isLoading,
  error,
  searchTerm,
  onSearchChange,
  sortKey,
  onSortChange,
  onTaskCreate,
}: TaskListProps) => {
  if (isLoading) return <Loader />;
  if (error) return <Alert color="red">{error}</Alert>;

  return (
    <Container>
      <Title>タスク一覧</Title>
      <SearchBox value={searchTerm} onChange={onSearchChange} />
      <TaskTable
        tasks={tasks}
        sortKey={sortKey}
        onSortChange={onSortChange}
      />
    </Container>
  );
};
```

**特徴**:
- propsのみを使用
- ロジックは一切持たない
- Storybookで単独表示可能

---

### 4. Custom Hooks Layer（カスタムフック層）

**責任**: ビジネスロジック、データ取得、状態管理

#### **データ取得フック**
```typescript
// features/tasks/hooks/useFetchTasks.ts
export const useFetchTasks = () => {
  const [data, setData] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await tasksApi.getAll();
        setData(response.data);
      } catch (e) {
        setError('データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
};
```

#### **フィルタリングフック**
```typescript
// features/tasks/hooks/useTaskFilters.ts
export const useTaskFilters = (tasks: Task[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || task.categoryId === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [tasks, searchTerm, selectedCategory]);

  return {
    filteredTasks,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
  };
};
```

#### **フォーム管理フック**
```typescript
// features/tasks/hooks/useTaskForm.ts
export const useTaskForm = (onSubmit: (data: CreateTaskDto) => Promise<void>) => {
  const [values, setValues] = useState<CreateTaskDto>({ title: '', status: null });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof CreateTaskDto, value: unknown) => {
    setValues(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!values.title.trim()) {
      newErrors.title = 'タイトルは必須です';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  };

  return { values, errors, isSubmitting, handleChange, handleSubmit };
};
```

---

### 5. API Layer（API層）

**責任**: HTTPリクエストの実行

```typescript
// features/tasks/api/tasksApi.ts
import { apiClient } from '@/lib/axios';
import type { Task, CreateTaskDto, UpdateTaskDto } from '@/types';

export const tasksApi = {
  getAll: async (): Promise<{ data: Task[] }> => {
    const response = await apiClient.get('/api/v1/tasks');
    return response.data;
  },

  getById: async (id: number): Promise<{ data: Task }> => {
    const response = await apiClient.get(`/api/v1/tasks/${id}`);
    return response.data;
  },

  create: async (data: CreateTaskDto): Promise<{ data: Task }> => {
    const response = await apiClient.post('/api/v1/tasks', { task: data });
    return response.data;
  },

  update: async (id: number, data: UpdateTaskDto): Promise<{ data: Task }> => {
    const response = await apiClient.put(`/api/v1/tasks/${id}`, { task: data });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/tasks/${id}`);
  },
};
```

---

## ディレクトリ構造詳細

```
src/
├── features/                      # 機能モジュール（Feature-based）
│   ├── tasks/
│   │   ├── components/
│   │   │   ├── TaskList/
│   │   │   │   ├── TaskList.tsx         # Presentational
│   │   │   │   ├── TaskList.test.tsx    # UIテスト（不要）
│   │   │   │   ├── TaskListContainer.tsx # Container
│   │   │   │   └── index.ts
│   │   │   ├── TaskForm/
│   │   │   ├── TaskTable/
│   │   │   └── index.ts                 # 公開コンポーネント
│   │   ├── hooks/
│   │   │   ├── useFetchTasks.ts         # データ取得
│   │   │   ├── useFetchTasks.test.ts    # ✅ テスト必須
│   │   │   ├── useTaskFilters.ts        # フィルタリング
│   │   │   ├── useTaskFilters.test.ts   # ✅ テスト必須
│   │   │   ├── useTaskSort.ts           # ソート
│   │   │   ├── useTaskForm.ts           # フォーム管理
│   │   │   ├── useTaskMutations.ts      # CRUD操作
│   │   │   └── index.ts
│   │   ├── api/
│   │   │   └── tasksApi.ts              # APIクライアント
│   │   ├── utils/
│   │   │   ├── taskValidation.ts        # バリデーション
│   │   │   ├── taskValidation.test.ts   # ✅ テスト必須
│   │   │   ├── taskFormatters.ts        # フォーマッター
│   │   │   └── taskFormatters.test.ts   # ✅ テスト必須
│   │   ├── types.ts                     # 機能固有の型
│   │   └── index.ts                     # 公開API
│   │
│   ├── categories/
│   │   └── ...（同様の構造）
│   │
│   ├── routineTasks/
│   │   ├── components/
│   │   │   ├── RoutineTaskList/
│   │   │   ├── RoutineTaskForm/
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   ├── useFetchRoutineTasks.ts
│   │   │   ├── useRoutineTaskMutations.ts
│   │   │   ├── useTaskGeneration.ts
│   │   │   └── useBatchTaskGeneration.ts
│   │   ├── api/
│   │   │   └── routineTasksApi.ts
│   │   └── index.ts
│   │
│   └── auth/
│       └── ...（同様の構造）
│
├── shared/                        # 共通モジュール
│   ├── components/
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   └── index.ts
│   │   ├── Modal/
│   │   ├── Layout/
│   │   │   ├── Layout.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── index.ts
│   │   └── DataTable/            # 汎用テーブル
│   ├── hooks/
│   │   ├── useApi.ts             # 汎用API hook
│   │   ├── useApi.test.ts        # ✅ テスト必須
│   │   ├── useNotification.ts    # 通知hook
│   │   ├── useDebounce.ts        # デバウンス
│   │   ├── useDebounce.test.ts   # ✅ テスト必須
│   │   └── useLocalStorage.ts    # LocalStorage
│   ├── utils/
│   │   ├── date.ts               # 日付ユーティリティ
│   │   ├── date.test.ts          # ✅ テスト必須
│   │   ├── validation.ts         # 共通バリデーション
│   │   └── validation.test.ts    # ✅ テスト必須
│   └── types/
│       └── common.ts             # 共通型
│
├── lib/                           # 外部ライブラリラッパー
│   ├── axios.ts                  # Axiosクライアント
│   ├── mantine.ts                # Mantine設定
│   └── auth0.ts                  # Auth0設定
│
├── pages/                         # ルーティング専用（薄いレイヤー）
│   ├── TasksPage.tsx             # TaskListContainerを配置するだけ
│   ├── CategoriesPage.tsx
│   └── index.ts
│
├── types/                         # グローバルドメイン型
│   ├── index.ts                  # 全型の再エクスポート
│   ├── task.ts                   # Task, TaskStatus, TaskPriority
│   ├── category.ts               # Category
│   ├── user.ts                   # User, Account
│   └── api.ts                    # ApiResponse<T>, ApiError
│
├── App.tsx                        # ルート設定
├── index.tsx                      # エントリーポイント
└── env.d.ts                       # 環境変数の型定義
```

---

## 実装パターン

### 1. Container/Presentational パターン

**目的**: UI（見た目）とロジック（データ取得・状態管理）を完全に分離

#### **Container（ロジック層）**
```typescript
// TaskListContainer.tsx
export const TaskListContainer = () => {
  // ロジックのみ
  const { data, loading } = useFetchTasks();
  const { filteredTasks, setSearch } = useTaskFilters(data);

  return (
    <TaskList
      tasks={filteredTasks}
      isLoading={loading}
      onSearchChange={setSearch}
    />
  );
};
```

#### **Presentational（UI層）**
```typescript
// TaskList.tsx
export type TaskListProps = {
  tasks: Task[];
  isLoading: boolean;
  onSearchChange: (term: string) => void;
};

export const TaskList = ({ tasks, isLoading, onSearchChange }: TaskListProps) => {
  // UIのみ
  return (
    <div>
      <input onChange={(e) => onSearchChange(e.target.value)} />
      {tasks.map(task => <TaskRow key={task.id} task={task} />)}
    </div>
  );
};
```

**メリット**:
- Presentationalコンポーネントは完全にpropsで制御可能
- Storybookで単独表示可能
- テストが不要（見た目はブラウザで確認）

---

### 2. Custom Hooks パターン

#### **単一責任の原則**
1つのhookは1つの責務のみを持つ

```typescript
// ✅ 良い例: 責務が明確
export const useFetchTasks = () => { /* データ取得のみ */ };
export const useTaskFilters = (tasks) => { /* フィルタリングのみ */ };
export const useTaskSort = (tasks) => { /* ソートのみ */ };

// ❌ 悪い例: 全てを1つのhookに詰め込む
export const useTasks = () => {
  // データ取得 + フィルタリング + ソート + CRUD
  // 200行超えの巨大hook
};
```

#### **Hooksの組み合わせ**
```typescript
const TaskListContainer = () => {
  // 小さいhooksを組み合わせる
  const { data } = useFetchTasks();
  const { filteredTasks } = useTaskFilters(data);
  const { sortedTasks } = useTaskSort(filteredTasks);
  const { createTask } = useTaskMutations();

  return <TaskList tasks={sortedTasks} onCreate={createTask} />;
};
```

---

### 3. 型定義パターン

#### **グローバル型（types/）**
```typescript
// types/task.ts
export type Task = {
  readonly id: number;
  title: string;
  status: TaskStatus | null;
  // ...
};

export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type CreateTaskDto = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;
```

#### **ローカル型（features/tasks/types.ts）**
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
```

#### **Props型**
```typescript
// TaskList.tsx
export type TaskListProps = {
  tasks: Task[];
  isLoading: boolean;
  onSearchChange: (term: string) => void;
};
```

---

## 設計原則

### 1. 単一責任の原則（SRP）

```typescript
// ✅ 良い例: 各要素が1つの責務のみ
const TaskListContainer = () => {
  const { data } = useFetchTasks();           // データ取得のみ
  return <TaskList tasks={data} />;
};

const TaskList = ({ tasks }) => {             // 表示のみ
  return tasks.map(task => <TaskRow task={task} />);
};

// ❌ 悪い例: コンポーネントが全てを担当
const TaskList = () => {
  // データ取得 + フィルタリング + ソート + UI + イベント処理
  // 300行超えの巨大コンポーネント
};
```

### 2. DRY原則（Don't Repeat Yourself）

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
const searchTerm = useDebounce(rawSearchTerm, 300);
```

### 3. Props Drilling の回避

```typescript
// ❌ 悪い例: Props Drilling
<TaskList categories={categories} onCategoryCreate={createCategory} />
  → <TaskTable categories={categories} onCategoryCreate={createCategory} />
    → <TaskRow categories={categories} onCategoryCreate={createCategory} />

// ✅ 良い例: Context API または状態管理ライブラリ
const CategoriesContext = createContext<Category[]>([]);

// または、必要な箇所でのみhookを使用
const { categories } = useCategories();
```

---

## 完全実装例

### タスク管理機能の完全実装

#### **1. 型定義**
```typescript
// types/task.ts
export type Task = {
  readonly id: number;
  accountId: string;
  title: string;
  description?: string;
  categoryId: number | null;
  status: TaskStatus | null;
  priority: TaskPriority | null;
  dueDate: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';
export type CreateTaskDto = Omit<Task, 'id' | 'accountId' | 'createdAt' | 'updatedAt'>;
export type UpdateTaskDto = Partial<CreateTaskDto>;
export type TaskSortKey = 'createdAt' | 'dueDate' | 'priority';
```

#### **2. APIクライアント**
```typescript
// features/tasks/api/tasksApi.ts
import { apiClient } from '@/lib/axios';
import type { Task, CreateTaskDto, UpdateTaskDto } from '@/types';

export const tasksApi = {
  getAll: async (): Promise<{ data: Task[] }> => {
    const response = await apiClient.get('/api/v1/tasks');
    return response.data;
  },

  create: async (data: CreateTaskDto): Promise<{ data: Task }> => {
    const response = await apiClient.post('/api/v1/tasks', { task: data });
    return response.data;
  },

  update: async (id: number, data: UpdateTaskDto): Promise<{ data: Task }> => {
    const response = await apiClient.put(`/api/v1/tasks/${id}`, { task: data });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/tasks/${id}`);
  },
};
```

#### **3. Custom Hooks**
```typescript
// features/tasks/hooks/useFetchTasks.ts
export const useFetchTasks = () => {
  const [data, setData] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const response = await tasksApi.getAll();
      setData(response.data);
      setError(null);
    } catch (e) {
      setError('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
};

// features/tasks/hooks/useTaskMutations.ts
export const useTaskMutations = () => {
  const createTask = async (data: CreateTaskDto) => {
    await tasksApi.create(data);
  };

  const updateTask = async (id: number, data: UpdateTaskDto) => {
    await tasksApi.update(id, data);
  };

  const deleteTask = async (id: number) => {
    await tasksApi.delete(id);
  };

  return { createTask, updateTask, deleteTask };
};
```

#### **4. Presentational Component**
```typescript
// features/tasks/components/TaskList/TaskList.tsx
export type TaskListProps = {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  onTaskCreate: (data: CreateTaskDto) => void;
};

export const TaskList = ({ tasks, isLoading, error, onTaskCreate }: TaskListProps) => {
  if (isLoading) return <Loader />;
  if (error) return <Alert color="red">{error}</Alert>;

  return (
    <Container>
      <Title>タスク一覧</Title>
      <Button onClick={() => onTaskCreate({ title: 'New Task' })}>
        タスク追加
      </Button>
      {tasks.map(task => (
        <TaskRow key={task.id} task={task} />
      ))}
    </Container>
  );
};
```

#### **5. Container Component**
```typescript
// features/tasks/components/TaskList/TaskListContainer.tsx
export const TaskListContainer = () => {
  const { data, loading, error, refetch } = useFetchTasks();
  const { createTask } = useTaskMutations();

  const handleCreate = async (taskData: CreateTaskDto) => {
    await createTask(taskData);
    refetch();
  };

  return (
    <TaskList
      tasks={data}
      isLoading={loading}
      error={error}
      onTaskCreate={handleCreate}
    />
  );
};
```

#### **6. Page**
```typescript
// pages/TasksPage.tsx
export const TasksPage = () => {
  return (
    <Layout>
      <TaskListContainer />
    </Layout>
  );
};
```

---

---

### 習慣化タスク管理機能の完全実装

#### **1. APIクライアント**

```typescript
// features/routineTasks/api/routineTasksApi.ts
import { apiClient } from '@/lib/axios';
import type { RoutineTask, CreateRoutineTaskDto, UpdateRoutineTaskDto, TaskGenerationJob } from '@/types';

export const routineTasksApi = {
  getAll: async (): Promise<{ data: RoutineTask[] }> => {
    const response = await apiClient.get('/api/v1/routine_tasks');
    return response.data;
  },

  create: async (data: CreateRoutineTaskDto): Promise<{ data: RoutineTask }> => {
    const response = await apiClient.post('/api/v1/routine_tasks', { routineTask: data });
    return response.data;
  },

  generateTasks: async (id: number): Promise<{ data: { jobId: string } }> => {
    const response = await apiClient.post(`/api/v1/routine_tasks/${id}/generate`);
    return response.data;
  },

  getGenerationStatus: async (id: number, jobId: string): Promise<{ data: TaskGenerationJob }> => {
    const response = await apiClient.get(`/api/v1/routine_tasks/${id}/generation_status?job_id=${jobId}`);
    return response.data;
  },
};
```

#### **2. タスク生成フック**

```typescript
// features/routineTasks/hooks/useTaskGeneration.ts
import { useState, useCallback, useEffect } from 'react';
import { routineTasksApi } from '../api/routineTasksApi';

export const useTaskGeneration = (routineTaskId: number | null) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<TaskGenerationJob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateTasks = useCallback(async () => {
    if (!routineTaskId) return;

    try {
      setIsGenerating(true);
      setError(null);
      const response = await routineTasksApi.generateTasks(routineTaskId);
      setJobId(response.data.jobId);
    } catch (e) {
      setError('タスクの生成に失敗しました');
    } finally {
      setIsGenerating(false);
    }
  }, [routineTaskId]);

  // ジョブステータスのポーリング
  useEffect(() => {
    if (!jobId || !routineTaskId) return;

    const interval = setInterval(async () => {
      try {
        const response = await routineTasksApi.getGenerationStatus(routineTaskId, jobId);
        setJobStatus(response.data);
        if (response.data.completed) {
          clearInterval(interval);
        }
      } catch (e) {
        console.error('ジョブステータスの取得に失敗しました', e);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [jobId, routineTaskId]);

  return { generateTasks, isGenerating, jobStatus, error };
};
```

---

## まとめ

このアーキテクチャガイドに従うことで、以下の効果が期待できます：

- **保守性**: UI/ロジック分離により、各層の責任が明確
- **拡張性**: 機能単位の構成により、新機能追加が容易
- **テスタビリティ**: ロジックを独立してテスト可能
- **可読性**: 一貫したパターンにより、理解しやすいコード
- **再利用性**: 小さいhooksの組み合わせにより、高い再利用性

このガイドは、プロジェクトの成長に合わせて継続的に更新していきます。
