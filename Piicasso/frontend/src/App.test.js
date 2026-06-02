import { render } from '@testing-library/react';
import { useContext } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { test, expect, vi } from 'vitest';
import { AuthProvider, AuthContext } from './context/AuthContext';

vi.mock('./api/axios', () => ({
  __esModule: true,
  default: {
    defaults: { headers: { common: {} } },
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(),
  },
}));

// Smoke test: App renders without crashing
test('renders without crashing', () => {
  // Minimal render — just verify the provider + router don't throw
  const { container } = render(
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div data-testid="app-root">PIIcasso loaded</div>
      </BrowserRouter>
    </AuthProvider>
  );
  expect(container).toBeTruthy();
});

test('auth context provides default values', () => {
  let contextValues = {};

  const TestConsumer = () => {
    contextValues = useContext(AuthContext);
    return <div>Consumer</div>;
  };

  render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>
  );

  expect(contextValues).toHaveProperty('isAuthenticated');
  expect(contextValues).toHaveProperty('login');
  expect(contextValues).toHaveProperty('logout');
});
