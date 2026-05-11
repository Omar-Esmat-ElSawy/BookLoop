import React from 'react';
import { render as rtlRender } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Mock contexts
export const mockAuthContext = {
  user: null,
  loading: false,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
};

export const mockBooksContext = {
  recentlyAdded: [],
  booksByGenre: {},
  genres: [],
  loading: false,
  fetchBooks: vi.fn(),
};

// Custom render function
function render(ui: React.ReactElement, { route = '/' } = {}) {
  window.history.pushState({}, 'Test page', route);

  return rtlRender(
    <BrowserRouter>
      {ui}
    </BrowserRouter>
  );
}

export * from '@testing-library/react';
export { render };
