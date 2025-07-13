import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Layout from './Layout'

// Mantineのモック
vi.mock('@mantine/core', () => ({
  Box: ({ children, ...props }: any) => <div data-testid="box" {...props}>{children}</div>,
  Table: ({ children, ...props }: any) => <table data-testid="table" {...props}>{children}</table>,
}))

// HeaderとSidebarのモック
vi.mock('./Header', () => ({
  default: () => <div data-testid="header">Header Component</div>,
}))

vi.mock('./Sidebar', () => ({
  default: () => <div data-testid="sidebar">Sidebar Component</div>,
}))

// DataTableのモック
vi.mock('./DataTable', () => ({
  DataTable: ({ children, ...props }: any) => <div data-testid="data-table" {...props}>{children}</div>,
}))

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('Layout', () => {
  it('renders header component', () => {
    renderWithRouter(<Layout>Test Content</Layout>)
    
    expect(screen.getByTestId('header')).toBeInTheDocument()
  })

  it('renders sidebar component', () => {
    renderWithRouter(<Layout>Test Content</Layout>)
    
    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
  })

  it('renders children content', () => {
    renderWithRouter(<Layout>Test Content</Layout>)
    
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('renders multiple children', () => {
    renderWithRouter(
      <Layout>
        <div>Child 1</div>
        <div>Child 2</div>
      </Layout>
    )
    
    expect(screen.getByText('Child 1')).toBeInTheDocument()
    expect(screen.getByText('Child 2')).toBeInTheDocument()
  })

  it('has correct layout structure', () => {
    renderWithRouter(<Layout>Test Content</Layout>)
    
    const boxes = screen.getAllByTestId('box')
    expect(boxes.length).toBeGreaterThan(0)
  })
}) 