import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Layout from './Layout';
import React from 'react';

// Mantineのモック
vi.mock('@mantine/core', () => ({
  Box: ({ children, ...props }: any) => (
    <div data-testid="box" {...props}>
      {children}
    </div>
  ),
  Table: ({ children, ...props }: any) => (
    <table data-testid="table" {...props}>
      {children}
    </table>
  ),
}));

// HeaderとSidebarのモック
vi.mock('./Header', () => ({
  default: () => <div data-testid="header">Header Component</div>,
}));

vi.mock('./Sidebar', () => ({
  default: () => <div data-testid="sidebar">Sidebar Component</div>,
}));

// DataTableのモック
vi.mock('./DataTable', () => ({
  DataTable: ({ children, ...props }: any) => (
    <div data-testid="data-table" {...props}>
      {children}
    </div>
  ),
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

describe('Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders header component', () => {
    renderWithRouter(<Layout>Test Content</Layout>);

    expect(screen.getByTestId('header')).toBeDefined();
  });

  it('renders sidebar component', () => {
    renderWithRouter(<Layout>Test Content</Layout>);

    expect(screen.getByTestId('sidebar')).toBeDefined();
  });

  it('renders children content', () => {
    renderWithRouter(<Layout>Test Content</Layout>);

    expect(screen.getByText('Test Content')).toBeDefined();
  });

  it('renders multiple children', () => {
    renderWithRouter(
      <Layout>
        <div>Child 1</div>
        <div>Child 2</div>
      </Layout>
    );

    expect(screen.getByText('Child 1')).toBeDefined();
    expect(screen.getByText('Child 2')).toBeDefined();
  });

  it('has correct layout structure', () => {
    renderWithRouter(<Layout>Test Content</Layout>);

    const boxes = screen.getAllByTestId('box');
    expect(boxes.length).toBeGreaterThan(0);
  });
});
