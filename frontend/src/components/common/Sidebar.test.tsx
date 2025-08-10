import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Sidebar from './Sidebar';
import React from 'react';

// React Routerのモック
const mockNavigate = vi.fn();
const mockLocation = { pathname: '/tasks' };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  };
});

// Mantineのモック
vi.mock('@mantine/core', () => ({
  Box: ({ children, ...props }: any) => (
    <div data-testid="sidebar" {...props}>
      {children}
    </div>
  ),
  NavLink: ({
    label,
    description,
    leftSection,
    active,
    onClick,
    ...props
  }: any) => (
    <button
      data-testid="nav-link"
      onClick={onClick}
      data-active={active}
      {...props}
    >
      {leftSection}
      <span data-testid="nav-label">{label}</span>
      <span data-testid="nav-description">{description}</span>
    </button>
  ),
  useMantineTheme: () => ({
    colors: {
      gray: [
        '#f8f9fa',
        '#e9ecef',
        '#dee2e6',
        '#ced4da',
        '#adb5bd',
        '#6c757d',
        '#495057',
        '#343a40',
        '#212529',
      ],
    },
  }),
  rem: (value: number) => `${value}px`,
}));

// Tabler Iconsのモック
vi.mock('@tabler/icons-react', () => ({
  IconChecklist: () => <span data-testid="checklist-icon">Checklist Icon</span>,
  IconPlus: () => <span data-testid="plus-icon">Plus Icon</span>,
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

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders sidebar with navigation items', () => {
    renderWithRouter(<Sidebar />);

    expect(screen.getByTestId('sidebar')).toBeDefined();
    expect(screen.getByText('タスク一覧')).toBeDefined();
    expect(screen.getByText('タスク作成')).toBeDefined();
  });

  it('renders navigation items with descriptions', () => {
    renderWithRouter(<Sidebar />);

    expect(screen.getByText('すべてのタスクを表示')).toBeDefined();
    expect(screen.getByText('新しいタスクを作成')).toBeDefined();
  });

  it('renders navigation items with icons', () => {
    renderWithRouter(<Sidebar />);

    expect(screen.getByTestId('checklist-icon')).toBeDefined();
    expect(screen.getByTestId('plus-icon')).toBeDefined();
  });

  it('calls navigate when navigation item is clicked', () => {
    renderWithRouter(<Sidebar />);

    const taskListLink = screen.getByText('タスク一覧');
    taskListLink.click();

    expect(mockNavigate).toHaveBeenCalledWith('/tasks');
  });

  it('calls navigate to new task page when create task is clicked', () => {
    renderWithRouter(<Sidebar />);

    const createTaskLink = screen.getByText('タスク作成');
    createTaskLink.click();

    expect(mockNavigate).toHaveBeenCalledWith('/tasks/new');
  });

  it('shows active state for current path', () => {
    renderWithRouter(<Sidebar />);

    const navLinks = screen.getAllByTestId('nav-link');
    const activeLink = navLinks.find(
      (link) => link.getAttribute('data-active') === 'true'
    );

    expect(activeLink).toBeDefined();
  });
});
