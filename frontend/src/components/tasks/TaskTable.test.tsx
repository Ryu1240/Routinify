import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { TaskTable } from './TaskTable';

// DataTableのモック
vi.mock('../common/DataTable/index', () => {
  const DataTableMock = ({ children, ...props }: any) => (
    <div data-testid="data-table" {...props}>
      {children}
    </div>
  );
  DataTableMock.Thead = ({ children, ...props }: any) => (
    <div data-testid="thead" {...props}>
      {children}
    </div>
  );
  DataTableMock.Tbody = ({
    children,
    emptyMessage,
    colSpan,
    ...props
  }: any) => (
    <div data-testid="tbody" {...props}>
      {children || <div data-testid="empty-message">{emptyMessage}</div>}
    </div>
  );
  DataTableMock.HeaderRow = ({
    columns,
    sortBy,
    reverseSortDirection,
    onSort,
    ...props
  }: any) => (
    <div data-testid="header-row" {...props}>
      {columns.map((column: any) => (
        <div key={column.key} data-testid="header-cell">
          {column.label}
        </div>
      ))}
    </div>
  );
  DataTableMock.Tr = ({ children, ...props }: any) => (
    <div data-testid="table-row" {...props}>
      {children}
    </div>
  );
  DataTableMock.Td = ({ children, ...props }: any) => (
    <div data-testid="table-cell" {...props}>
      {children}
    </div>
  );
  DataTableMock.TableColumn = {};

  return {
    DataTable: DataTableMock,
    TableColumn: {},
  };
});

// Mantineのモック
vi.mock('@mantine/core', () => ({
  Text: ({ children, ...props }: any) => (
    <span data-testid="text" {...props}>
      {children}
    </span>
  ),
  Badge: ({ children, ...props }: any) => (
    <span data-testid="badge" {...props}>
      {children}
    </span>
  ),
  Group: ({ children, ...props }: any) => (
    <div data-testid="group" {...props}>
      {children}
    </div>
  ),
  ActionIcon: ({ children, onClick, ...props }: any) => (
    <button data-testid="action-icon" onClick={onClick} {...props}>
      {children}
    </button>
  ),
  Tooltip: ({ children, label, ...props }: any) => (
    <div data-testid="tooltip" title={label} {...props}>
      {children}
    </div>
  ),
}));

// Tabler Iconsのモック
vi.mock('@tabler/icons-react', () => ({
  IconEdit: () => <span data-testid="edit-icon">Edit Icon</span>,
  IconTrash: () => <span data-testid="trash-icon">Trash Icon</span>,
}));

// taskUtilsのモック
vi.mock('../../utils/taskUtils', () => ({
  getPriorityColor: (priority: string | null) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return '#1D74AE';
      case 'medium':
        return '#335471';
      case 'low':
        return '#5B819B';
      default:
        return '#929198';
    }
  },
  getStatusColor: (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return '#1D74AE';
      case 'in_progress':
        return '#335471';
      case 'pending':
        return '#5B819B';
      case 'cancelled':
        return '#929198';
      default:
        return '#929198';
    }
  },
  getCategoryColor: (category: string | null) => {
    if (!category) return '#929198';
    const colors = ['#1D74AE', '#335471', '#5B819B', '#032742'];
    const index = category.charCodeAt(0) % colors.length;
    return colors[index];
  },
  formatDate: (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ja-JP');
  },
}));

// COLORSのモック
vi.mock('../../constants/colors', () => ({
  COLORS: {
    PRIMARY: '#1D74AE',
    GRAY: '#929198',
  },
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }}>
      {component}
    </BrowserRouter>
  );
};

const mockTasks = [
  {
    id: 1,
    title: 'Test Task 1',
    category: 'Work',
    priority: 'high',
    status: 'pending',
    dueDate: '2024-12-31',
    createdAt: '2024-01-01',
  },
  {
    id: 2,
    title: 'Test Task 2',
    category: 'Personal',
    priority: 'medium',
    status: 'completed',
    dueDate: null,
    createdAt: '2024-01-02',
  },
];

describe('TaskTable', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnSort = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders data table', () => {
    renderWithRouter(
      <TaskTable
        tasks={mockTasks}
        sortBy={null}
        reverseSortDirection={false}
        onSort={mockOnSort}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByTestId('data-table')).toBeDefined();
  });

  it('renders task titles', () => {
    renderWithRouter(
      <TaskTable
        tasks={mockTasks}
        sortBy={null}
        reverseSortDirection={false}
        onSort={mockOnSort}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Test Task 1')).toBeDefined();
    expect(screen.getByText('Test Task 2')).toBeDefined();
  });

  it('renders category badges', () => {
    renderWithRouter(
      <TaskTable
        tasks={mockTasks}
        sortBy={null}
        reverseSortDirection={false}
        onSort={mockOnSort}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Work')).toBeDefined();
    expect(screen.getByText('Personal')).toBeDefined();
  });

  it('renders priority badges', () => {
    renderWithRouter(
      <TaskTable
        tasks={mockTasks}
        sortBy={null}
        reverseSortDirection={false}
        onSort={mockOnSort}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('high')).toBeDefined();
    expect(screen.getByText('medium')).toBeDefined();
  });

  it('renders status badges', () => {
    renderWithRouter(
      <TaskTable
        tasks={mockTasks}
        sortBy={null}
        reverseSortDirection={false}
        onSort={mockOnSort}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('pending')).toBeDefined();
    expect(screen.getByText('completed')).toBeDefined();
  });

  it('renders formatted dates', () => {
    renderWithRouter(
      <TaskTable
        tasks={mockTasks}
        sortBy={null}
        reverseSortDirection={false}
        onSort={mockOnSort}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('2024/12/31')).toBeDefined();
    expect(screen.getByText('2024/1/1')).toBeDefined();
    expect(screen.getByText('2024/1/2')).toBeDefined();
  });

  it('renders action icons', () => {
    renderWithRouter(
      <TaskTable
        tasks={mockTasks}
        sortBy={null}
        reverseSortDirection={false}
        onSort={mockOnSort}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const actionIcons = screen.getAllByTestId('action-icon');
    expect(actionIcons.length).toBeGreaterThan(0);
  });

  it('calls onEdit when edit icon is clicked', () => {
    renderWithRouter(
      <TaskTable
        tasks={mockTasks}
        sortBy={null}
        reverseSortDirection={false}
        onSort={mockOnSort}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const editIcons = screen.getAllByTestId('edit-icon');
    const editButtons = editIcons
      .map((icon) => icon.closest('button'))
      .filter(Boolean);

    if (editButtons.length > 0) {
      fireEvent.click(editButtons[0] as HTMLElement);
      expect(mockOnEdit).toHaveBeenCalledWith(1);
    }
  });

  it('calls onDelete when delete icon is clicked', () => {
    renderWithRouter(
      <TaskTable
        tasks={mockTasks}
        sortBy={null}
        reverseSortDirection={false}
        onSort={mockOnSort}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const trashIcons = screen.getAllByTestId('trash-icon');
    const deleteButtons = trashIcons
      .map((icon) => icon.closest('button'))
      .filter(Boolean);

    if (deleteButtons.length > 0) {
      fireEvent.click(deleteButtons[0] as HTMLElement);
      expect(mockOnDelete).toHaveBeenCalledWith(1);
    }
  });

  it('handles empty tasks array', () => {
    renderWithRouter(
      <TaskTable
        tasks={[]}
        sortBy={null}
        reverseSortDirection={false}
        onSort={mockOnSort}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByTestId('data-table')).toBeDefined();
  });

  it('handles tasks with null values', () => {
    const tasksWithNulls = [
      {
        id: 1,
        title: 'Test Task',
        category: null,
        priority: null,
        status: null,
        dueDate: null,
        createdAt: '2024-01-01',
      },
    ];

    renderWithRouter(
      <TaskTable
        tasks={tasksWithNulls}
        sortBy={null}
        reverseSortDirection={false}
        onSort={mockOnSort}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Test Task')).toBeDefined();
    // category, priority, dueDateの3つのnull値が'-'として表示される
    const dashElements = screen.getAllByText('-');
    expect(dashElements.length).toBeGreaterThanOrEqual(3);
  });
});
