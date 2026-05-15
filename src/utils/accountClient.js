const BASE = '/api';

function getToken() { return localStorage.getItem('future-you-token'); }
function authHeaders() {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const authClient = {
  register: (email, password, name) => req('POST', '/auth/register', { email, password, name }),
  login:    (email, password)       => req('POST', '/auth/login',    { email, password }),
  me:            ()                          => req('GET',  '/auth/me'),
  forgotPassword:(email)                     => req('POST', '/auth/forgot-password', { email }),
  resetPassword: (email, token, newPassword) => req('POST', '/auth/reset-password',  { email, token, newPassword }),
};

export const profileClient = {
  load: ()        => req('GET', '/profile'),
  save: (profile) => req('PUT', '/profile', { profile }),
};

export const goalsClient = {
  load: ()      => req('GET', '/profile/goals'),
  save: (goals) => req('PUT', '/profile/goals', { goals }),
};

export const daysClient = {
  list:   ()        => req('GET',    '/days'),
  get:    (id)      => req('GET',    `/days/${id}`),
  save:   (payload) => req('POST',   '/days', payload),
  update: (id, d)   => req('PATCH',  `/days/${id}`, d),
  delete: (id)      => req('DELETE', `/days/${id}`),
};
