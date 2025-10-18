# カスタムフック層（Custom Hooks Layer）

## 📋 概要

カスタムフック層は、ビジネスロジック、データ取得、状態管理を担当する層です。
React Hooksを活用して、ロジックを再利用可能な形で提供します。

## 🎯 責任範囲

### **主要な責任**
- データ取得（API呼び出し）
- ビジネスロジックの実装
- 状態管理（useState, useReducer）
- 副作用の管理（useEffect）
- フィルタリング、ソート等の処理

### **責任外**
- UIの表示（コンポーネント層に委譲）
- 直接的なAPI呼び出し（API層に委譲）

## 🏗️ アーキテクチャ

### **hooks の種類**

```
features/tasks/hooks/
├── useFetchTasks.ts       # データ取得
├── useTaskFilters.ts      # フィルタリング
├── useTaskSort.ts         # ソート
├── useTaskForm.ts         # フォーム管理
├── useTaskMutations.ts    # CRUD操作
└── index.ts
```

## 💻 実装パターン

### **1. データ取得フック**

```typescript
// features/tasks/hooks/useFetchTasks.ts
import { useState, useEffect, useCallback } from 'react';
import { tasksApi } from '../api/tasksApi';
import type { Task } from '@/types';

export const useFetchTasks = () => {
  const [data, setData] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await tasksApi.getAll();
      setData(response.data);
    } catch (e) {
      setError('データの取得に失敗しました');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
};
```

### **2. フィルタリングフック**

```typescript
// features/tasks/hooks/useTaskFilters.ts
import { useState, useMemo } from 'react';
import type { Task } from '@/types';

export const useTaskFilters = (tasks: Task[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch = task.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory =
        !selectedCategory || task.categoryId === selectedCategory;
      const matchesStatus = !selectedStatus || task.status === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [tasks, searchTerm, selectedCategory, selectedStatus]);

  return {
    filteredTasks,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    selectedStatus,
    setSelectedStatus,
  };
};
```

### **3. ソートフック**

```typescript
// features/tasks/hooks/useTaskSort.ts
import { useState, useMemo } from 'react';
import type { Task, TaskSortKey } from '@/types';

export const useTaskSort = (tasks: Task[]) => {
  const [sortKey, setSortKey] = useState<TaskSortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const sortedTasks = useMemo(() => {
    if (!sortKey) return tasks;

    return [...tasks].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [tasks, sortKey, sortDirection]);

  const toggleSort = (key: TaskSortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  return { sortedTasks, sortKey, sortDirection, setSortKey, toggleSort };
};
```

### **4. フォーム管理フック**

```typescript
// features/tasks/hooks/useTaskForm.ts
import { useState, useCallback } from 'react';
import type { CreateTaskDto } from '@/types';

type UseTaskFormProps = {
  initialValues?: Partial<CreateTaskDto>;
  onSubmit: (data: CreateTaskDto) => Promise<void>;
};

export const useTaskForm = ({ initialValues, onSubmit }: UseTaskFormProps) => {
  const [values, setValues] = useState<CreateTaskDto>({
    title: '',
    description: '',
    status: null,
    priority: null,
    ...initialValues,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((field: keyof CreateTaskDto, value: unknown) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  }, []);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!values.title.trim()) {
      newErrors.title = 'タイトルは必須です';
    }

    if (values.title.length > 100) {
      newErrors.title = 'タイトルは100文字以内で入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [values]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validate, onSubmit]);

  const reset = useCallback(() => {
    setValues({ title: '', description: '', status: null, priority: null, ...initialValues });
    setErrors({});
  }, [initialValues]);

  return {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    reset,
  };
};
```

### **5. CRUD操作フック**

```typescript
// features/tasks/hooks/useTaskMutations.ts
import { useCallback } from 'react';
import { tasksApi } from '../api/tasksApi';
import type { CreateTaskDto, UpdateTaskDto } from '@/types';

export const useTaskMutations = () => {
  const createTask = useCallback(async (data: CreateTaskDto) => {
    await tasksApi.create(data);
  }, []);

  const updateTask = useCallback(async (id: number, data: UpdateTaskDto) => {
    await tasksApi.update(id, data);
  }, []);

  const deleteTask = useCallback(async (id: number) => {
    await tasksApi.delete(id);
  }, []);

  return { createTask, updateTask, deleteTask };
};
```

---

## 📏 設計原則

### **単一責任の原則**

```typescript
// ✅ 良い例: 1つのhookは1つの責務
export const useFetchTasks = () => { /* データ取得のみ */ };
export const useTaskFilters = (tasks) => { /* フィルタリングのみ */ };
export const useTaskSort = (tasks) => { /* ソートのみ */ };

// ❌ 悪い例: 複数の責務を持つ巨大hook
export const useTasks = () => {
  // データ取得 + フィルタリング + ソート + CRUD + キャッシュ
  // 300行超えの巨大hook
};
```

### **戻り値はオブジェクトで返す**

```typescript
// ✅ 良い例: オブジェクトで返す（名前でアクセス）
export const useFetchTasks = () => {
  return { data, loading, error, refetch };
};

const { data, loading } = useFetchTasks();

// ❌ 悪い例: 配列で返す（順序依存）
export const useFetchTasks = () => {
  return [data, loading, error, refetch];
};

const [data, loading] = useFetchTasks();  // 順序を覚える必要がある
```

---

## 🧪 テスト（必須）

### **Custom Hooksのテスト**

```typescript
// hooks/useFetchTasks.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useFetchTasks } from './useFetchTasks';
import { tasksApi } from '../api/tasksApi';

vi.mock('../api/tasksApi');

describe('useFetchTasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('初期状態でタスクを取得する', async () => {
    const mockTasks = [
      { id: 1, title: 'Task 1', status: 'pending' },
      { id: 2, title: 'Task 2', status: 'completed' },
    ];
    vi.mocked(tasksApi.getAll).mockResolvedValue({ data: mockTasks });

    const { result } = renderHook(() => useFetchTasks());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockTasks);
    expect(tasksApi.getAll).toHaveBeenCalledTimes(1);
  });

  it('エラー時にエラーメッセージを返す', async () => {
    const mockError = new Error('Network error');
    vi.mocked(tasksApi.getAll).mockRejectedValue(mockError);

    const { result } = renderHook(() => useFetchTasks());

    await waitFor(() => {
      expect(result.current.error).toBe('データの取得に失敗しました');
    });
  });

  it('refetchで再取得できる', async () => {
    vi.mocked(tasksApi.getAll).mockResolvedValue({ data: [] });

    const { result } = renderHook(() => useFetchTasks());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    vi.mocked(tasksApi.getAll).mockClear();

    await result.current.refetch();

    expect(tasksApi.getAll).toHaveBeenCalledTimes(1);
  });
});
```

---

## ✅ ベストプラクティス

1. **単一責任の原則を守る**
2. **戻り値はオブジェクトで返す**
3. **useCallbackで関数をメモ化（子コンポーネントに渡す場合）**
4. **useMemoで重い計算をメモ化**
5. **依存配列を正しく設定**
6. **テストカバレッジ90%以上**

---

## 📚 関連ドキュメント

- [コンポーネント層の説明](LAYER_COMPONENTS.md)
- [型定義の説明](LAYER_TYPES.md)
- [アーキテクチャガイド](../ARCHITECTURE_GUIDE.md)
- [コーディング規約](../CODING_STANDARDS.md)
