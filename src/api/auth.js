const AUTH_BASE = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:3001/api/v1/auth';
const CASE_BASE = import.meta.env.VITE_CASE_API_URL || 'http://localhost:3002/api/v1';

async function request(url, options = {}) {
  const token = localStorage.getItem('sdes_token');
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || 'Request failed');
  return data;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function loginUser({ email, password }) {
  return request(`${AUTH_BASE}/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

// Admin registers their org + account in one step.
// The backend /register endpoint creates the user; we extend here
// to also create the org if your backend supports it, otherwise
// call register then a separate org endpoint.
export async function registerAdmin({ name, email, password, orgName }) {
  return request(`${AUTH_BASE}/register`, {
    method: 'POST',
    body: JSON.stringify({ name, email, password, org_name: orgName, role: 'admin' }),
  });
}

// ── Departments ───────────────────────────────────────────────────────────────

export async function getDepartments() {
  return request(`${CASE_BASE}/departments`);
}

export async function createDepartment({ name }) {
  return request(`${CASE_BASE}/departments`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

// ── Members (admin creates credentials for other users) ───────────────────────

export async function getMembers() {
  return request(`${CASE_BASE}/members`);
}

export async function createMember({ name, email, password, deptId, role }) {
  return request(`${AUTH_BASE}/register`, {
    method: 'POST',
    body: JSON.stringify({ name, email, password, dept_id: deptId, role: role || 'user' }),
  });
}

// ── Cases ─────────────────────────────────────────────────────────────────────

export async function getCases() {
  return request(`${CASE_BASE}/cases`);
}

export async function createCase({ title, description }) {
  return request(`${CASE_BASE}/cases`, {
    method: 'POST',
    body: JSON.stringify({ title, description }),
  });
}

export async function assignCaseToDept({ caseId, deptId }) {
  return request(`${CASE_BASE}/cases/${caseId}/department`, {
    method: 'PUT',
    body: JSON.stringify({ dept_id: deptId }),
  });
}

export async function assignUserToCase({ caseId, userId, role }) {
  return request(`${CASE_BASE}/cases/${caseId}/users`, {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, role }),
  });
}
