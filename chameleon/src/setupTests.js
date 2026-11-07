import '@testing-library/jest-dom';

// Provide a stable localStorage polyfill for Node >=22 test environments
let store = {};
const localStorageMock = {
  getItem: (key) => store[key] || null,
  setItem: (key, value) => {
    store[key] = String(value);
  },
  removeItem: (key) => {
    delete store[key];
  },
  clear: () => {
    store = {};
  },
  get length() {
    return Object.keys(store).length;
  },
  key: (i) => Object.keys(store)[i] || null,
};

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true, configurable: true });
}
globalThis.localStorage = localStorageMock;
