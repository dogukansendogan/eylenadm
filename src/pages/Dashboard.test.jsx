import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Dashboard from './Dashboard';

// Firebase mock
vi.mock('../services/firebase', () => ({
  db: {}
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  getDocs: vi.fn(() => Promise.resolve({
    size: 5,
    forEach: (cb) => cb({ data: () => ({ status: 'approved', totalPrice: 1000 }) })
  }))
}));

// AuthContext mock
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    currentUser: { email: 'admin@test.com' },
    logout: vi.fn()
  })
}));

// ThemeContext mock
vi.mock('../contexts/ThemeContext', () => ({
  useTheme: () => ({
    isDarkMode: false,
    toggleTheme: vi.fn()
  })
}));

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly and fetches stats', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    // Initial loading state or titles
    expect(screen.getByText('Genel Durum')).toBeInTheDocument();
    
    // Wait for the stats to load and assert their presence
    await waitFor(() => {
      // Because we mock size:5 for all collections, totalVillas will be 5, totalUsers will be 5
      expect(screen.getAllByText('5').length).toBeGreaterThan(0);
    });

    expect(screen.getByText('Toplam Villa')).toBeInTheDocument();
    expect(screen.getByText('Aktif Rezervasyon')).toBeInTheDocument();
  });

  it('renders management modules', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    expect(screen.getByText('Villa Yönetimi')).toBeInTheDocument();
    expect(screen.getByText('Rezervasyon Yönetimi')).toBeInTheDocument();
    expect(screen.getByText('Kullanıcı Yönetimi')).toBeInTheDocument();
  });
});
