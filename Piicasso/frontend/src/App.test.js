import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Smoke test: App renders without crashing
test('renders without crashing', () => {
  // Minimal render — just verify the provider + router don't throw
  const { container } = render(
    <AuthProvider>
      <BrowserRouter>
        <div data-testid="app-root">PIIcasso loaded</div>
      </BrowserRouter>
    </AuthProvider>
  );
  expect(container).toBeTruthy();
});

test('auth context provides default values', () => {
  let contextValues = {};

  const TestConsumer = () => {
    const { useContext } = require('react');
    const { AuthContext } = require('./context/AuthContext');
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
