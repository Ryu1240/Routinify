# 型定義層（Types Layer）

## 📋 概要

型定義層は、アプリケーション全体で使用する型を管理する層です。
TypeScriptの型システムを活用して、型安全な開発を実現します。

## 🎯 配置戦略（ハイブリッド方式）

### **グローバル型（types/）**
複数機能で使用するドメインモデルやAPI型

### **ローカル型（features/内）**
特定機能内でのみ使用する型

## 🏗️ ディレクトリ構造

```
src/
├── types/                     # グローバル型定義
│   ├── index.ts              # 全型の再エクスポート
│   ├── task.ts               # Task関連
│   ├── category.ts           # Category関連
│   ├── routineTask.ts         # RoutineTask関連
│   ├── user.ts               # User関連
│   └── api.ts                # API共通型
│
└── features/
    ├── tasks/
    │   ├── types.ts          # タスク機能固有の型
    │   └── components/
    │       └── TaskList/
    │           └── TaskList.tsx  # Props型は同ファイル内
    └── routineTasks/
        └── types.ts          # 習慣化タスク機能固有の型
```

## 💻 実装例

### **1. グローバルドメイン型**

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

// DTO型
export type CreateTaskDto = Omit<
  Task,
  'id' | 'accountId' | 'createdAt' | 'updatedAt'
>;
export type UpdateTaskDto = Partial<CreateTaskDto>;

// ユーティリティ型
export type TaskKeys = keyof Task;
export type TaskSortKey = Extract<TaskKeys, 'createdAt' | 'dueDate' | 'priority'>;
```

### **2. API共通型**

```typescript
// types/api.ts
export type ApiResponse<T> = {
  data: T;
  message?: string;
};

export type ApiError = {
  errors: string[];
  status: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    perPage: number;
  };
};
```

### **3. 機能固有の型**

```typescript
// features/tasks/types.ts
export type TaskFilterState = {
  searchTerm: string;
  selectedCategory: number | null;
  selectedStatus: TaskStatus | null;
};

export type TaskSortState = {
  key: TaskSortKey | null;
  direction: 'asc' | 'desc';
};

export type TaskFormData = {
  title: string;
  description: string;
  dueDate: string | null;
  status: TaskStatus | null;
  priority: TaskPriority | null;
  categoryId: number | null;
};
```

### **4. Props型（コンポーネント内）**

```typescript
// features/tasks/components/TaskList/TaskList.tsx
import type { Task, CreateTaskDto, UpdateTaskDto } from '@/types';

export type TaskListProps = {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  onTaskCreate: (data: CreateTaskDto) => void;
  onTaskEdit: (id: number, data: UpdateTaskDto) => void;
  onTaskDelete: (id: number) => void;
};

export const TaskList = (props: TaskListProps) => {
  // ...
};
```

### **5. 習慣化タスクの型定義**

```typescript
// types/routineTask.ts
export type RoutineTask = {
  readonly id: number;
  accountId: string;
  title: string;
  frequency: RoutineTaskFrequency;
  intervalValue: number | null;
  lastGeneratedAt: string | null;
  nextGenerationAt: string;
  maxActiveTasks: number;
  categoryId: number | null;
  priority: TaskPriority | null;
  isActive: boolean;
  dueDateOffsetDays: number | null;
  dueDateOffsetHour: number | null;
  startGenerationAt: string;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type RoutineTaskFrequency = 'daily' | 'weekly' | 'monthly' | 'custom';

export type CreateRoutineTaskDto = Omit<
  RoutineTask,
  'id' | 'accountId' | 'lastGeneratedAt' | 'createdAt' | 'updatedAt'
>;

export type UpdateRoutineTaskDto = Partial<CreateRoutineTaskDto>;

export type TaskGenerationJob = {
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  completed: boolean;
  generatedTasksCount: number | null;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
};
```

### **6. 型の再エクスポート**

```typescript
// types/index.ts
export type { Task, TaskStatus, TaskPriority, CreateTaskDto, UpdateTaskDto } from './task';
export type { Category, CreateCategoryDto, UpdateCategoryDto } from './category';
export type { RoutineTask, RoutineTaskFrequency, CreateRoutineTaskDto, UpdateRoutineTaskDto, TaskGenerationJob } from './routineTask';
export type { User, Account } from './user';
export type { ApiResponse, ApiError, PaginatedResponse } from './api';
```

---

## 📏 型定義のルール

### **1. typeで統一（interfaceは使用しない）**

```typescript
// ✅ 良い例: typeを使用
export type Task = {
  id: number;
  title: string;
};

export type TaskStatus = 'pending' | 'in_progress' | 'completed';

// ❌ 悪い例: interfaceは使用しない
export interface Task {
  id: number;
  title: string;
}
```

**理由**:
- パフォーマンス（微小だが高速）
- Union/Intersection型の表現力
- Mapped Typesとの親和性
- 意図しない拡張の防止

### **2. readonlyの活用**

```typescript
// ✅ 良い例: 不変プロパティはreadonly
export type Task = {
  readonly id: number;
  title: string;
  readonly createdAt: string;
  readonly updatedAt: string;
};
```

### **3. nullableはunion型で表現**

```typescript
// ✅ 良い例: null許容はunion型
export type Task = {
  categoryId: number | null;
  status: TaskStatus | null;
  dueDate: string | null;
};

// ❌ 悪い例: undefinedは使用しない
export type Task = {
  categoryId?: number;  // undefined不可
};
```

### **4. オプショナルプロパティ**

```typescript
// ✅ 良い例: ?を使用
export type Task = {
  id: number;
  title: string;
  description?: string;  // 任意
};

// ❌ 悪い例: undefinedのunion
export type Task = {
  description: string | undefined;  // ?を使用すべき
};
```

---

## 🔧 ユーティリティ型の活用

### **Omit - 特定プロパティを除外**

```typescript
export type CreateTaskDto = Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'accountId'>;
```

### **Partial - 全プロパティをオプショナルに**

```typescript
export type UpdateTaskDto = Partial<CreateTaskDto>;
```

### **Pick - 特定プロパティのみ抽出**

```typescript
export type TaskSummary = Pick<Task, 'id' | 'title' | 'status'>;
```

### **Extract - Union型から特定の型を抽出**

```typescript
export type TaskKeys = keyof Task;
export type TaskSortKey = Extract<TaskKeys, 'createdAt' | 'dueDate' | 'priority'>;
```

### **typeof - 値から型を生成**

```typescript
export const TASK_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const;

export type TaskStatus = typeof TASK_STATUS[keyof typeof TASK_STATUS];
```

---

## 🎯 型定義のベストプラクティス

### **1. 定数と型の連携**

```typescript
// ✅ 良い例: 定数から型を自動生成
export const TASK_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const;

export type TaskStatus = typeof TASK_STATUS[keyof typeof TASK_STATUS];

// 使用例
if (task.status === TASK_STATUS.PENDING) {
  // TypeScriptが型を推論
}

// ❌ 悪い例: 定数と型が分離
export const TASK_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
};

export type TaskStatus = 'pending' | 'in_progress';  // 手動で同期が必要
```

### **2. ジェネリクスの活用**

```typescript
// ✅ 良い例: ジェネリクスで再利用性向上
export type ApiResponse<T> = {
  data: T;
  message?: string;
};

type TaskResponse = ApiResponse<Task>;
type TaskListResponse = ApiResponse<Task[]>;
```

### **3. Discriminated Union**

```typescript
// ✅ 良い例: タグ付きUnion型
export type LoadingState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: Task[] }
  | { status: 'error'; error: string };

const handleState = (state: LoadingState) => {
  switch (state.status) {
    case 'idle':
      return null;
    case 'loading':
      return <Loader />;
    case 'success':
      return <TaskList tasks={state.data} />;  // TypeScriptがdataの存在を保証
    case 'error':
      return <Alert>{state.error}</Alert>;  // TypeScriptがerrorの存在を保証
  }
};
```

---

## 📚 環境変数の型定義

```typescript
// src/env.d.ts
/// <reference types="react-scripts" />

declare namespace NodeJS {
  interface ProcessEnv {
    readonly NODE_ENV: 'development' | 'production' | 'test';
    readonly REACT_APP_AUTH0_DOMAIN: string;
    readonly REACT_APP_AUTH0_CLIENT_ID: string;
    readonly REACT_APP_AUTH0_AUDIENCE: string;
    readonly REACT_APP_API_URL: string;
  }
}
```

---

## ✅ ベストプラクティス

1. **typeで統一（interfaceは使用しない）**
2. **readonlyで不変性を保証**
3. **nullableはunion型（undefinedは使用しない）**
4. **ユーティリティ型を積極活用**
5. **定数から型を自動生成**
6. **ジェネリクスで再利用性向上**

---

## 📚 関連ドキュメント

- [APIレスポンス型の配置方針](API_RESPONSE_TYPES_POLICY.md)（#294）
- [データ取得戦略](DATA_FETCHING_STRATEGY.md)（#296）
- [コンポーネント層の説明](LAYER_COMPONENTS.md)
- [カスタムフック層の説明](LAYER_HOOKS.md)
- [アーキテクチャガイド](../ARCHITECTURE_GUIDE.md)
- [コーディング規約](../CODING_STANDARDS.md)
