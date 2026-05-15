'use client';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

export function getAdminToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('hs_admin_token');
}
export function getAdminUser() {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem('hs_admin_user') || 'null'); }
  catch { return null; }
}
export function clearAdminSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('hs_admin_token');
  localStorage.removeItem('hs_admin_user');
}

export async function adminFetch(path, opts = {}) {
  const token = getAdminToken();
  if (!token) throw new Error('not authenticated');
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(data?.error || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}
