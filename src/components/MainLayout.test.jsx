import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import MainLayout from './MainLayout';
import * as AuthContext from '../contexts/AuthContext';

// Mock contexts
vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

vi.mock('../contexts/ThemeContext', () => ({
  useTheme: () => ({
    isDarkMode: false,
    toggleTheme: vi.fn()
  })
}));

describe('MainLayout Component', () => {
  it('renders navigation links and user info', () => {
    AuthContext.useAuth.mockReturnValue({
      currentUser: { email: 'admin@eylen.com' },
      logout: vi.fn()
    });

    render(
      <BrowserRouter>
        <MainLayout title="Test Page">
          <div data-testid="child-content">Child Content</div>
        </MainLayout>
      </BrowserRouter>
    );

    // Verify title and child content
    expect(screen.getByText('Test Page')).toBeInTheDocument();
    expect(screen.getByTestId('child-content')).toBeInTheDocument();

    // Verify nav links (e.g. Ana Sayfa, Villalar)
    expect(screen.getAllByText('Ana Sayfa').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Villalar').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Rezervasyonlar').length).toBeGreaterThan(0);

    // Verify user info is displayed
    expect(screen.getByText('admin@eylen.com')).toBeInTheDocument();
  });

  it('calls logout function when logout button is clicked', () => {
    const mockLogout = vi.fn().mockResolvedValue();
    AuthContext.useAuth.mockReturnValue({
      currentUser: { email: 'admin@eylen.com' },
      logout: mockLogout
    });

    render(
      <BrowserRouter>
        <MainLayout title="Test Page" />
      </BrowserRouter>
    );

    // Find logout button (by title "Çıkış Yap")
    const logoutButtons = screen.getAllByTitle('Çıkış Yap');
    // Click the first one (Desktop version)
    fireEvent.click(logoutButtons[0]);

    expect(mockLogout).toHaveBeenCalled();
  });
});
