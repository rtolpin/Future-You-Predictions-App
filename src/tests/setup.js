import '@testing-library/jest-dom';

// Clear localStorage between tests
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

// Silence console.error noise in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('Warning:')) return;
    originalError(...args);
  };
});
afterAll(() => { console.error = originalError; });
