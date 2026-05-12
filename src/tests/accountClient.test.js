import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authClient, daysClient } from '../utils/accountClient.js';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

function mockResponse(data, ok = true) {
  return Promise.resolve({
    ok,
    json: () => Promise.resolve(data),
  });
}

describe('accountClient — auth', () => {
  beforeEach(() => { mockFetch.mockReset(); localStorage.clear(); });

  it('login sends email + password and returns user + token', async () => {
    mockFetch.mockReturnValueOnce(mockResponse({ user: { id: 1, email: 'test@test.com' }, token: 'jwt123' }));
    const data = await authClient.login('test@test.com', 'pass123');
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({ method: 'POST' }));
    expect(data.token).toBe('jwt123');
    expect(data.user.email).toBe('test@test.com');
  });

  it('register sends name + email + password', async () => {
    mockFetch.mockReturnValueOnce(mockResponse({ user: { id: 2, email: 'new@test.com', name: 'Alice' }, token: 'jwt456' }));
    const data = await authClient.register('new@test.com', 'pass123', 'Alice');
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/register', expect.objectContaining({ method: 'POST' }));
    expect(data.user.name).toBe('Alice');
  });

  it('me sends Authorization header with stored token', async () => {
    localStorage.setItem('future-you-token', 'my-jwt');
    mockFetch.mockReturnValueOnce(mockResponse({ user: { id: 1 } }));
    await authClient.me();
    const [, opts] = mockFetch.mock.calls[0];
    expect(opts.headers.Authorization).toBe('Bearer my-jwt');
  });

  it('throws on non-ok response', async () => {
    mockFetch.mockReturnValueOnce(mockResponse({ error: 'Invalid password' }, false));
    await expect(authClient.login('a@a.com', 'wrong')).rejects.toThrow('Invalid password');
  });

  it('forgotPassword sends email', async () => {
    mockFetch.mockReturnValueOnce(mockResponse({ resetCode: '123456' }));
    const data = await authClient.forgotPassword('a@a.com');
    expect(data.resetCode).toBe('123456');
  });

  it('resetPassword sends email + token + newPassword', async () => {
    mockFetch.mockReturnValueOnce(mockResponse({ user: { id: 1 }, token: 'newjwt' }));
    const data = await authClient.resetPassword('a@a.com', '123456', 'newpass');
    expect(data.token).toBe('newjwt');
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.token).toBe('123456');
    expect(body.newPassword).toBe('newpass');
  });
});

describe('accountClient — days', () => {
  beforeEach(() => { mockFetch.mockReset(); localStorage.setItem('future-you-token', 'jwt'); });

  it('list fetches GET /api/days', async () => {
    mockFetch.mockReturnValueOnce(mockResponse({ days: [{ id: 1, title: 'My Day' }] }));
    const data = await daysClient.list();
    expect(mockFetch).toHaveBeenCalledWith('/api/days', expect.objectContaining({ method: 'GET' }));
    expect(data.days).toHaveLength(1);
  });

  it('save sends POST with events array', async () => {
    mockFetch.mockReturnValueOnce(mockResponse({ day: { id: 99 } }));
    await daysClient.save({ date: '2025-01-15', events: [{ id: 'e1' }] });
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/days');
    expect(opts.method).toBe('POST');
    const body = JSON.parse(opts.body);
    expect(body.events).toHaveLength(1);
  });

  it('delete sends DELETE /api/days/:id', async () => {
    mockFetch.mockReturnValueOnce(mockResponse({ ok: true }));
    await daysClient.delete(5);
    expect(mockFetch).toHaveBeenCalledWith('/api/days/5', expect.objectContaining({ method: 'DELETE' }));
  });
});
