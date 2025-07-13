import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import TaskList from './TaskList'
import React from 'react'

// useAuthのモック
const mockUseAuth = vi.fn()
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

// useTasksのモック
const mockUseTasks = vi.fn()
vi.mock('../../hooks/useTasks', () => ({
  useTasks: () => mockUseTasks(),
}))

// TaskTableのモック
vi.mock('./TaskTable', () => ({
  TaskTable: ({ tasks, onEdit, onDelete, ...props }: any) => (
    <div data-testid="task-table">
      {tasks.map((task: any) => (
        <div key={task.id} data-testid={`task-${task.id}`}>
          {task.title}
          <button onClick={() => onEdit(task.id)} data-testid={`edit-${task.id}`}>
            Edit
          </button>
          <button onClick={() => onDelete(task.id)} data-testid={`delete-${task.id}`}>
            Delete
          </button>
        </div>
      ))}
    </div>
  ),
}))

// Mantineのモック
vi.mock('@mantine/core', () => ({
  TextInput: ({ placeholder, leftSection, value, onChange, ...props }: any) => (
    <input
      data-testid="search-input"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      {...props}
    />
  ),
  Group: ({ children, ...props }: any) => <div data-testid="group" {...props}>{children}</div>,
  Text: ({ children, ...props }: any) => <span data-testid="text" {...props}>{children}</span>,
  Container: ({ children, ...props }: any) => <div data-testid="container" {...props}>{children}</div>,
  Loader: ({ ...props }: any) => <div data-testid="loader" {...props}>Loading...</div>,
  Alert: ({ title, children, ...props }: any) => (
    <div data-testid="alert" {...props}>
      <span data-testid="alert-title">{title}</span>
      {children}
    </div>
  ),
  Button: ({ children, leftSection, onClick, ...props }: any) => (
    <button data-testid="button" onClick={onClick} {...props}>
      {leftSection}
      {children}
    </button>
  ),
  Title: ({ children, ...props }: any) => <h2 data-testid="title" {...props}>{children}</h2>,
}))

// Tabler Iconsのモック
vi.mock('@tabler/icons-react', () => ({
  IconSearch: () => <span data-testid="search-icon">Search Icon</span>,
  IconPlus: () => <span data-testid="plus-icon">Plus Icon</span>,
}))

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

const mockTasks = [
  { id: 1, title: 'Task 1', category: 'Work', status: 'pending' },
  { id: 2, title: 'Task 2', category: 'Personal', status: 'completed' },
]

describe('TaskList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  it('renders task list title', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    })
    mockUseTasks.mockReturnValue({
      filteredTasks: mockTasks,
      search: '',
      setSearch: vi.fn(),
      sortBy: null,
      reverseSortDirection: false,
      loading: false,
      error: null,
      setSorting: vi.fn(),
    })

    renderWithRouter(<TaskList />)
    
    expect(screen.getByText('タスク一覧')).toBeDefined()
  })

  it('renders search input', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    })
    mockUseTasks.mockReturnValue({
      filteredTasks: mockTasks,
      search: '',
      setSearch: vi.fn(),
      sortBy: null,
      reverseSortDirection: false,
      loading: false,
      error: null,
      setSorting: vi.fn(),
    })

    renderWithRouter(<TaskList />)
    
    expect(screen.getByTestId('search-input')).toBeDefined()
    expect(screen.getByPlaceholderText('タスク名、カテゴリ、ステータスで検索...')).toBeDefined()
  })

  it('renders add task button', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    })
    mockUseTasks.mockReturnValue({
      filteredTasks: mockTasks,
      search: '',
      setSearch: vi.fn(),
      sortBy: null,
      reverseSortDirection: false,
      loading: false,
      error: null,
      setSorting: vi.fn(),
    })

    renderWithRouter(<TaskList />)
    
    expect(screen.getByText('タスク追加')).toBeDefined()
  })

  it('shows loading state when auth is loading', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    })
    mockUseTasks.mockReturnValue({
      filteredTasks: [],
      search: '',
      setSearch: vi.fn(),
      sortBy: null,
      reverseSortDirection: false,
      loading: false,
      error: null,
      setSorting: vi.fn(),
    })

    renderWithRouter(<TaskList />)
    
    expect(screen.getByText('認証情報を確認中...')).toBeDefined()
  })

  it('shows loading state when tasks are loading', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    })
    mockUseTasks.mockReturnValue({
      filteredTasks: [],
      search: '',
      setSearch: vi.fn(),
      sortBy: null,
      reverseSortDirection: false,
      loading: true,
      error: null,
      setSorting: vi.fn(),
    })

    renderWithRouter(<TaskList />)
    
    expect(screen.getByText('タスクを読み込み中...')).toBeDefined()
  })

  it('shows authentication required alert when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    })
    mockUseTasks.mockReturnValue({
      filteredTasks: [],
      search: '',
      setSearch: vi.fn(),
      sortBy: null,
      reverseSortDirection: false,
      loading: false,
      error: null,
      setSorting: vi.fn(),
    })

    renderWithRouter(<TaskList />)
    
    expect(screen.getByText('認証が必要')).toBeDefined()
    expect(screen.getByText('タスク一覧を表示するにはログインが必要です。')).toBeDefined()
  })

  it('shows error alert when there is an error', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    })
    mockUseTasks.mockReturnValue({
      filteredTasks: [],
      search: '',
      setSearch: vi.fn(),
      sortBy: null,
      reverseSortDirection: false,
      loading: false,
      error: 'タスクの取得に失敗しました',
      setSorting: vi.fn(),
    })

    renderWithRouter(<TaskList />)
    
    expect(screen.getByText('エラー')).toBeDefined()
    expect(screen.getByText('タスクの取得に失敗しました')).toBeDefined()
  })

  it('renders task table with tasks', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    })
    mockUseTasks.mockReturnValue({
      filteredTasks: mockTasks,
      search: '',
      setSearch: vi.fn(),
      sortBy: null,
      reverseSortDirection: false,
      loading: false,
      error: null,
      setSorting: vi.fn(),
    })

    renderWithRouter(<TaskList />)
    
    expect(screen.getByTestId('task-table')).toBeDefined()
  })

  it('shows task count when tasks exist', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    })
    mockUseTasks.mockReturnValue({
      filteredTasks: mockTasks,
      search: '',
      setSearch: vi.fn(),
      sortBy: null,
      reverseSortDirection: false,
      loading: false,
      error: null,
      setSorting: vi.fn(),
    })

    renderWithRouter(<TaskList />)
    
    expect(screen.getByText('2件のタスクを表示中')).toBeDefined()
  })

  it('calls handleAddTask when add task button is clicked', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    })
    mockUseTasks.mockReturnValue({
      filteredTasks: mockTasks,
      search: '',
      setSearch: vi.fn(),
      sortBy: null,
      reverseSortDirection: false,
      loading: false,
      error: null,
      setSorting: vi.fn(),
    })

    renderWithRouter(<TaskList />)
    
    const addButton = screen.getByText('タスク追加')
    fireEvent.click(addButton)
    
    expect(consoleSpy).toHaveBeenCalledWith('タスク追加ボタンがクリックされました')
    
    consoleSpy.mockRestore()
  })
}) 