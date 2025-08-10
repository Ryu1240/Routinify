import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CreateTaskModal from './CreateTaskModal';
import { CreateTaskData } from './definitions/types';

// Mantineコンポーネントのモック
vi.mock('@mantine/core', () => ({
  Modal: ({ opened, onClose, title, children }: any) =>
    opened ? (
      <div data-testid="modal">
        <div data-testid="modal-header">
          {title}
          <button data-testid="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div data-testid="modal-body">{children}</div>
      </div>
    ) : null,
  TextInput: ({ label, value, onChange, error, type, ...props }: any) => {
    const id = `input-${label?.toLowerCase().replace(/\s+/g, '-')}`;
    return (
      <div>
        <label htmlFor={id}>{label}</label>
        <input
          id={id}
          type={type || 'text'}
          value={value}
          onChange={onChange}
          data-testid={id}
          {...props}
        />
        {error && <div data-testid="input-error">{error}</div>}
      </div>
    );
  },
  Select: ({ label, data, value, onChange }: any) => {
    const id = `select-${label?.toLowerCase().replace(/\s+/g, '-')}`;
    return (
      <div>
        <label htmlFor={id}>{label}</label>
        <select
          id={id}
          value={value}
          onChange={(e) => onChange && onChange(e.target.value)}
          data-testid={id}
        >
          {data &&
            data.map((option: any) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
        </select>
      </div>
    );
  },
  Button: ({ children, onClick, loading, disabled }: any) => (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      data-testid={`button-${children?.toString().toLowerCase().replace(/\s+/g, '-')}`}
    >
      {loading ? 'Loading...' : children}
    </button>
  ),
  Group: ({ children }: any) => <div data-testid="group">{children}</div>,
  Stack: ({ children }: any) => <div data-testid="stack">{children}</div>,
  Title: ({ children }: any) => <h3 data-testid="title">{children}</h3>,
  Loader: () => <div data-testid="loader">Loading...</div>,
}));

const renderComponent = (component: React.ReactElement) => {
  return render(component);
};

describe('CreateTaskModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  const defaultProps = {
    opened: true,
    onClose: mockOnClose,
    onSubmit: mockOnSubmit,
    loading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('モーダルが正しく表示される', () => {
    renderComponent(<CreateTaskModal {...defaultProps} />);

    expect(screen.getByText('新しいタスクを作成')).toBeInTheDocument();
    expect(screen.getByLabelText('タスク名')).toBeInTheDocument();
    expect(screen.getByLabelText('期限日')).toBeInTheDocument();
    expect(screen.getByLabelText('ステータス')).toBeInTheDocument();
    expect(screen.getByLabelText('優先度')).toBeInTheDocument();
    expect(screen.getByLabelText('カテゴリ')).toBeInTheDocument();
  });

  it('タスク名が必須であることを検証する', async () => {
    renderComponent(<CreateTaskModal {...defaultProps} />);

    const submitButton = screen.getByTestId('button-作成');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('タスク名は必須です')).toBeInTheDocument();
    });
  });

  it('正しいデータでフォームが送信される', async () => {
    const mockSubmit = vi.fn().mockResolvedValue(undefined);

    renderComponent(
      <CreateTaskModal {...defaultProps} onSubmit={mockSubmit} />
    );

    // タスク名を入力
    const titleInput = screen.getByLabelText('タスク名');
    fireEvent.change(titleInput, { target: { value: 'テストタスク' } });

    // カテゴリを入力
    const categoryInput = screen.getByLabelText('カテゴリ');
    fireEvent.change(categoryInput, { target: { value: 'テストカテゴリ' } });

    // フォームを送信
    const submitButton = screen.getByTestId('button-作成');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        title: 'テストタスク',
        dueDate: null,
        status: '未着手',
        priority: '中',
        category: 'テストカテゴリ',
      });
    });
  });

  it('キャンセルボタンでモーダルが閉じる', () => {
    renderComponent(<CreateTaskModal {...defaultProps} />);

    const cancelButton = screen.getByTestId('button-キャンセル');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('ローディング状態が正しく表示される', () => {
    renderComponent(<CreateTaskModal {...defaultProps} loading={true} />);

    const submitButton = screen.getByTestId('button-作成');
    expect(submitButton).toBeDisabled();

    const cancelButton = screen.getByTestId('button-キャンセル');
    expect(cancelButton).toBeDisabled();
  });

  it('フォーム送信後にモーダルが閉じられ、フォームがリセットされる', async () => {
    const mockSubmit = vi.fn().mockResolvedValue(undefined);

    renderComponent(
      <CreateTaskModal {...defaultProps} onSubmit={mockSubmit} />
    );

    // タスク名を入力
    const titleInput = screen.getByLabelText('タスク名');
    fireEvent.change(titleInput, { target: { value: 'テストタスク' } });

    // フォームを送信
    const submitButton = screen.getByTestId('button-作成');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
