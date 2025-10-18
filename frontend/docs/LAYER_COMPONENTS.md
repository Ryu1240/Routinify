# コンポーネント層（Component Layer）

## 📋 概要

コンポーネント層は、UIの表示とユーザーインタラクションを担当する層です。
React SPAにおいて、ユーザーとアプリケーションの接点となる重要な層です。

## 🎯 責任範囲

### **主要な責任**
- UIの表示（見た目）
- ユーザーイベントの受付
- propsを通じたデータの受け取り
- 子コンポーネントへのprops渡し

### **責任外**
- データ取得（Custom Hooksに委譲）
- ビジネスロジック（Custom Hooksに委譲）
- API呼び出し（API層に委譲）
- 複雑な状態管理（Custom Hooksに委譲）

## 🏗️ アーキテクチャ

### **基本構造**
```
src/features/tasks/components/
├── TaskList/
│   ├── TaskList.tsx              # Presentational（UI）
│   ├── TaskListContainer.tsx     # Container（ロジック）
│   └── index.ts
├── TaskForm/
│   ├── TaskForm.tsx
│   ├── TaskFormContainer.tsx
│   └── index.ts
└── index.ts
```

### **Container/Presentational パターン**
```
Container Component（ロジック）
    ↓ props
Presentational Component（UI）
```

## 💻 実装例

### **Presentational Component（UI層）**

```typescript
// features/tasks/components/TaskList/TaskList.tsx
import { Container, Title, TextInput, Loader, Alert } from '@mantine/core';
import type { Task, CreateTaskDto } from '@/types';

export type TaskListProps = {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onTaskCreate: (data: CreateTaskDto) => void;
  onTaskEdit: (id: number, data: UpdateTaskDto) => void;
  onTaskDelete: (id: number) => void;
};

export const TaskList = ({
  tasks,
  isLoading,
  error,
  searchTerm,
  onSearchChange,
  onTaskCreate,
  onTaskEdit,
  onTaskDelete,
}: TaskListProps) => {
  // ローディング状態
  if (isLoading) {
    return (
      <Container>
        <Loader size="lg" />
        <Text>タスクを読み込み中...</Text>
      </Container>
    );
  }

  // エラー状態
  if (error) {
    return (
      <Container>
        <Alert color="red" title="エラー">
          {error}
        </Alert>
      </Container>
    );
  }

  // 通常表示
  return (
    <Container>
      <Title order={2}>タスク一覧</Title>

      <TextInput
        placeholder="タスクを検索..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
      />

      {tasks.length === 0 ? (
        <Text c="dimmed">タスクがありません</Text>
      ) : (
        <div>
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onEdit={onTaskEdit}
              onDelete={onTaskDelete}
            />
          ))}
        </div>
      )}

      <Button onClick={() => onTaskCreate({ title: 'New Task' })}>
        タスク追加
      </Button>
    </Container>
  );
};
```

**特徴**:
- propsのみを使用（useState, useEffect等なし）
- ロジックは一切持たない
- 純粋にUIの表示のみ
- Storybookで単独表示可能

### **Container Component（ロジック層）**

```typescript
// features/tasks/components/TaskList/TaskListContainer.tsx
import { useFetchTasks } from '@/features/tasks/hooks/useFetchTasks';
import { useTaskFilters } from '@/features/tasks/hooks/useTaskFilters';
import { useTaskSort } from '@/features/tasks/hooks/useTaskSort';
import { useTaskMutations } from '@/features/tasks/hooks/useTaskMutations';
import { TaskList } from './TaskList';
import type { CreateTaskDto, UpdateTaskDto } from '@/types';

export const TaskListContainer = () => {
  // データ取得
  const { data: tasks, loading, error, refetch } = useFetchTasks();

  // フィルタリング
  const { filteredTasks, searchTerm, setSearchTerm } = useTaskFilters(tasks);

  // ソート
  const { sortedTasks, sortKey, setSortKey } = useTaskSort(filteredTasks);

  // CRUD操作
  const { createTask, updateTask, deleteTask } = useTaskMutations();

  // イベントハンドラ
  const handleCreate = async (data: CreateTaskDto) => {
    await createTask(data);
    refetch();
  };

  const handleEdit = async (id: number, data: UpdateTaskDto) => {
    await updateTask(id, data);
    refetch();
  };

  const handleDelete = async (id: number) => {
    await deleteTask(id);
    refetch();
  };

  // Presentationalコンポーネントにpropsを渡すのみ
  return (
    <TaskList
      tasks={sortedTasks}
      isLoading={loading}
      error={error}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onTaskCreate={handleCreate}
      onTaskEdit={handleEdit}
      onTaskDelete={handleDelete}
    />
  );
};
```

**特徴**:
- Custom Hooksを組み合わせてロジックを構築
- UIは持たない（`return <TaskList ... />`のみ）
- イベントハンドラでhooksの関数を呼び出す

---

## 📏 適切な抽象化レベル

### **Presentational Componentに記述すべき内容**

✅ **UIの表示**:
```typescript
<Container>
  <Title>タスク一覧</Title>
  <TextInput />
  <Button>追加</Button>
</Container>
```

✅ **条件分岐による表示制御**:
```typescript
{isLoading ? <Loader /> : <TaskTable tasks={tasks} />}
{error && <Alert>{error}</Alert>}
{tasks.length === 0 && <Text>データがありません</Text>}
```

✅ **イベントハンドラの呼び出し**:
```typescript
<Button onClick={() => onTaskCreate({ title: 'New' })}>
  追加
</Button>

<TextInput
  onChange={(e) => onSearchChange(e.target.value)}
/>
```

### **Presentational Componentに記述すべきでない内容**

❌ **データ取得**:
```typescript
// ❌ 悪い例
const TaskList = () => {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    fetch('/api/tasks').then(/* ... */);
  }, []);

  return <div>{/* ... */}</div>;
};
```

❌ **ビジネスロジック**:
```typescript
// ❌ 悪い例
const TaskList = ({ tasks }: { tasks: Task[] }) => {
  const filteredTasks = tasks.filter(task => {
    // 複雑なフィルタリングロジック
  });

  return <div>{/* ... */}</div>;
};
```

❌ **複雑な状態管理**:
```typescript
// ❌ 悪い例
const TaskList = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  // 10個以上のstate...

  return <div>{/* ... */}</div>;
};
```

---

## 🔧 コンポーネント設計パターン

### **1. 小さいコンポーネントに分割**

```typescript
// ✅ 良い例: 小さいコンポーネント
export const TaskList = ({ tasks }: TaskListProps) => {
  return (
    <Container>
      <TaskListHeader />
      <TaskListSearch />
      <TaskListTable tasks={tasks} />
      <TaskListFooter />
    </Container>
  );
};

export const TaskListHeader = () => {
  return <Title>タスク一覧</Title>;
};

export const TaskListSearch = () => {
  return <TextInput placeholder="検索..." />;
};

// ❌ 悪い例: 巨大なコンポーネント
export const TaskList = ({ tasks }: TaskListProps) => {
  return (
    <Container>
      {/* 300行のJSX */}
    </Container>
  );
};
```

### **2. Props型の明確化**

```typescript
// ✅ 良い例: Props型を明確に定義
export type TaskRowProps = {
  task: Task;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
};

export const TaskRow = ({ task, onEdit, onDelete }: TaskRowProps) => {
  return (
    <tr>
      <td>{task.title}</td>
      <td>
        <Button onClick={() => onEdit(task.id)}>編集</Button>
        <Button onClick={() => onDelete(task.id)}>削除</Button>
      </td>
    </tr>
  );
};

// ❌ 悪い例: Props型が不明確
export const TaskRow = ({ task, onEdit, onDelete }) => {
  // 型定義なし
};
```

### **3. デフォルトProps**

```typescript
// ✅ 良い例: デフォルト値を設定
export type TaskListProps = {
  tasks: Task[];
  isLoading?: boolean;
  error?: string | null;
};

export const TaskList = ({
  tasks,
  isLoading = false,
  error = null,
}: TaskListProps) => {
  // ...
};

// 使用例
<TaskList tasks={tasks} />  // isLoading, errorは自動的にデフォルト値
```

---

## 🧪 テスト

### **Presentational Componentはテスト不要**

**理由**:
- UIの見た目は手動確認が確実
- propsを渡せば表示されるだけ
- ロジックがないためテストの価値が低い
- Storybookで視覚的に確認可能

### **Storybookの活用**

```typescript
// TaskList.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { TaskList } from './TaskList';

const meta: Meta<typeof TaskList> = {
  component: TaskList,
  title: 'Features/Tasks/TaskList',
};

export default meta;
type Story = StoryObj<typeof TaskList>;

export const Default: Story = {
  args: {
    tasks: [
      { id: 1, title: 'Task 1', status: 'pending' },
      { id: 2, title: 'Task 2', status: 'completed' },
    ],
    isLoading: false,
    error: null,
    searchTerm: '',
    onSearchChange: (term) => console.log('Search:', term),
    onTaskCreate: (data) => console.log('Create:', data),
  },
};

export const Loading: Story = {
  args: {
    ...Default.args,
    isLoading: true,
  },
};

export const Error: Story = {
  args: {
    ...Default.args,
    error: 'データの取得に失敗しました',
  },
};

export const Empty: Story = {
  args: {
    ...Default.args,
    tasks: [],
  },
};
```

---

## 🚫 避けるべきパターン

### **1. Fat Component（太ったコンポーネント）**

```typescript
// ❌ 悪い例: 全てをコンポーネント内に詰め込む
const TaskList = () => {
  // 50行のstate定義
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  // ...10個以上のstate

  // 50行のuseEffect
  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    filterTasks();
  }, [searchTerm]);

  // 50行のヘルパー関数
  const fetchTasks = async () => { /* ... */ };
  const filterTasks = () => { /* ... */ };
  const sortTasks = () => { /* ... */ };

  // 200行のJSX
  return <div>{/* ... */}</div>;
};
```

### **2. Props Drilling**

```typescript
// ❌ 悪い例: 深いProps Drilling
<TaskList categories={categories} onCategoryCreate={createCategory} />
  → <TaskTable categories={categories} onCategoryCreate={createCategory} />
    → <TaskRow categories={categories} onCategoryCreate={createCategory} />
      → <TaskCell categories={categories} onCategoryCreate={createCategory} />

// ✅ 良い例: 必要な箇所でhookを使用
const TaskCell = () => {
  const { categories } = useCategories();  // 必要な箇所で取得
  return <div>{/* ... */}</div>;
};
```

---

## ✅ ベストプラクティス

1. **Container/Presentational パターンを必ず適用**
2. **Presentational Componentは50行以内**
3. **Props型を明確に定義**
4. **小さいコンポーネントに分割**
5. **Storybookで視覚的に確認**
6. **UIコンポーネントはテスト不要**

---

## 📚 関連ドキュメント

- [カスタムフック層の説明](LAYER_HOOKS.md)
- [型定義の説明](LAYER_TYPES.md)
- [アーキテクチャガイド](../ARCHITECTURE_GUIDE.md)
- [コーディング規約](../CODING_STANDARDS.md)
