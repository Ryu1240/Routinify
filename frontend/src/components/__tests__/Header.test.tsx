import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Header from '../Header';
import { Auth0Context } from '@auth0/auth0-react';

const mockLogout = jest.fn();

const renderHeader = () => {
  render(
    <Auth0Context.Provider value={{ logout: mockLogout } as any}>
      <Header />
    </Auth0Context.Provider>
  );
};

describe('Header', () => {
  beforeEach(() => {
    mockLogout.mockClear();
  });

  it('ロゴ画像が表示される', () => {
    renderHeader();
    const logo = screen.getByAltText('Routinify Logo');
    expect(logo).toBeInTheDocument();
  });

  it('サービス名が表示される', () => {
    renderHeader();
    expect(screen.getByText('Routinify')).toBeInTheDocument();
  });

  it('サブタイトルが表示される', () => {
    renderHeader();
    expect(screen.getByText('習慣化支援サービス')).toBeInTheDocument();
  });

  it('ログアウトボタンが表示される', () => {
    renderHeader();
    expect(screen.getByRole('button', { name: 'ログアウト' })).toBeInTheDocument();
  });

  it('ログアウトボタンを押すとlogoutが呼ばれる', () => {
    renderHeader();
    const button = screen.getByRole('button', { name: 'ログアウト' });
    fireEvent.click(button);
    expect(mockLogout).toHaveBeenCalled();
  });
}); 