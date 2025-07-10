import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Header from './Header'

// Auth0のモック
const mockLogout = vi.fn()
vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({
    logout: mockLogout,
    isAuthenticated: true,
    user: { name: 'Test User' },
  }),
}))

// Mantineのモック
vi.mock('@mantine/core', () => ({
  Group: ({ children, ...props }: any) => <div data-testid="group" {...props}>{children}</div>,
  Button: ({ children, onClick, leftSection, ...props }: any) => (
    <button data-testid="button" onClick={onClick} {...props}>
      {leftSection}
      {children}
    </button>
  ),
  Text: ({ children, ...props }: any) => <span data-testid="text" {...props}>{children}</span>,
  Container: ({ children, ...props }: any) => <div data-testid="container" {...props}>{children}</div>,
  Image: ({ src, alt, ...props }: any) => <img data-testid="image" src={src} alt={alt} {...props} />,
  rem: (value: number) => `${value}px`,
}))

// Tabler Iconsのモック
vi.mock('@tabler/icons-react', () => ({
  IconLogout: () => <span data-testid="logout-icon">Logout Icon</span>,
}))

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('Header', () => {
  it('renders the header with logo and service name', () => {
    renderWithRouter(<Header />)
    
    expect(screen.getByText('Routinify')).toBeInTheDocument()
    expect(screen.getByText('習慣化支援サービス')).toBeInTheDocument()
    expect(screen.getByAltText('Routinify Logo')).toBeInTheDocument()
  })

  it('renders logout button', () => {
    renderWithRouter(<Header />)
    
    expect(screen.getByText('ログアウト')).toBeInTheDocument()
    expect(screen.getByTestId('logout-icon')).toBeInTheDocument()
  })

  it('calls logout function when logout button is clicked', () => {
    renderWithRouter(<Header />)
    
    const logoutButton = screen.getByText('ログアウト')
    logoutButton.click()
    
    expect(mockLogout).toHaveBeenCalledTimes(1)
  })

  it('has correct header structure', () => {
    renderWithRouter(<Header />)
    
    expect(screen.getByTestId('container')).toBeInTheDocument()
    expect(screen.getAllByTestId('group')).toHaveLength(2) // 左側と右側のGroup
  })
}) 