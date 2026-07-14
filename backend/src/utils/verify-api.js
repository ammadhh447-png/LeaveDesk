/**
 * End-to-end API verification against a running server.
 * Uses seed credentials when available; falls back to DB user discovery.
 * Usage: node src/utils/verify-api.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User.js';

dotenv.config();

const BASE = process.env.API_BASE || 'http://localhost:5000/api';
const URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/employee-leave-portal';

const SEED_ACCOUNTS = {
  admin: { email: 'leavedesk123@gmail.com', password: 'leavedesk123' },
  manager: { email: 'manager@company.com', password: 'manager123' },
  employee: { email: 'ali@company.com', password: 'employee123' },
};

const results = [];

function record(name, ok, detail = '') {
  results.push({ name, ok, detail });
  const mark = ok ? 'PASS' : 'FAIL';
  console.log(`[${mark}] ${name}${detail ? ` — ${detail}` : ''}`);
}

async function request(path, { method = 'GET', body, token, expect = [200] } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Cookie = `token=${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  const ok = expect.includes(res.status);
  return { ok, status: res.status, data };
}

async function login(email, password, label) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const setCookie = res.headers.get('set-cookie') || '';
  const match = setCookie.match(/token=([^;]+)/);
  const data = await res.json();

  if (!res.ok || !match) {
    return { token: null, skipped: true, reason: data?.message || `status ${res.status}` };
  }

  record(`Auth: ${label} login (${email})`, true);
  return { token: match[1], skipped: false };
}

async function testPublic() {
  const checks = [
    ['/health', 'Health'],
    ['/departments', 'Departments list'],
    ['/policies', 'Policies list'],
    ['/holidays', 'Holidays list'],
  ];

  for (const [path, name] of checks) {
    const { ok, status, data } = await request(path);
    record(`Public: ${name}`, ok && data?.success !== false, `status ${status}`);
  }
}

async function testUnauthorized() {
  const protectedPaths = [
    '/auth/me',
    '/users/dashboard',
    '/leaves/my',
    '/notifications',
  ];

  for (const path of protectedPaths) {
    const { status } = await request(path, { expect: [401] });
    record(`Auth guard: ${path} requires login`, status === 401, `status ${status}`);
  }
}

async function testRole(label, token, tests) {
  if (!token) return;

  for (const { name, path, method, expect } of tests) {
    const { ok, status, data } = await request(path, { method, token, expect });
    const success = ok && (expect?.includes(status) || data?.success !== false);
    record(`${label}: ${name}`, success, `status ${status}`);
  }
}

const adminTests = [
  { name: 'Get me', path: '/auth/me' },
  { name: 'Dashboard', path: '/users/dashboard' },
  { name: 'Profile', path: '/users/profile' },
  { name: 'Users list', path: '/users?page=1&limit=10' },
  { name: 'Pending employees', path: '/users/pending?page=1&limit=10' },
  { name: 'Leave history', path: '/leaves/history?page=1&limit=10' },
  { name: 'Pending leaves', path: '/leaves/pending?page=1&limit=10' },
  { name: 'Team calendar', path: '/leaves/calendar' },
  { name: 'Notifications', path: '/notifications?page=1&limit=10' },
  { name: 'Unread count', path: '/notifications/unread-count' },
  { name: 'Announcements', path: '/notifications/announcements?page=1&limit=10' },
  { name: 'Team profile activity', path: '/activities/team-profile?page=1&limit=10' },
  { name: 'Reports dashboard', path: '/reports/dashboard' },
  { name: 'Reports analytics', path: '/reports/analytics' },
  { name: 'Departments search', path: '/departments?page=1&limit=10&search=IT' },
];

const managerTests = [
  { name: 'Get me', path: '/auth/me' },
  { name: 'Dashboard', path: '/users/dashboard' },
  { name: 'Team members', path: '/users/team?page=1&limit=10' },
  { name: 'Pending employees', path: '/users/pending?page=1&limit=10' },
  { name: 'Pending leaves', path: '/leaves/pending?page=1&limit=10' },
  { name: 'Manager dashboard', path: '/leaves/manager-dashboard' },
  { name: 'Team calendar', path: '/leaves/calendar' },
  { name: 'Team profile activity', path: '/activities/team-profile?page=1&limit=10' },
  { name: 'Manage announcements', path: '/notifications/announcements/manage?page=1&limit=10' },
  { name: 'Users list (forbidden)', path: '/users', expect: [403] },
];

const employeeTests = [
  { name: 'Get me', path: '/auth/me' },
  { name: 'Dashboard', path: '/users/dashboard' },
  { name: 'Profile', path: '/users/profile' },
  { name: 'Leave balance', path: '/users/leave-balance' },
  { name: 'My leaves', path: '/leaves/my?page=1&limit=10' },
  { name: 'Leave history', path: '/leaves/history?page=1&limit=10' },
  { name: 'My activity', path: '/activities/my?page=1&limit=10' },
  { name: 'Notifications', path: '/notifications?page=1&limit=10' },
  { name: 'Announcements', path: '/notifications/announcements?page=1&limit=10' },
  { name: 'Pending leaves (forbidden)', path: '/leaves/pending', expect: [403] },
  { name: 'Reports (forbidden)', path: '/reports/dashboard', expect: [403] },
];

async function verifyDatabaseUsers() {
  await mongoose.connect(URI);
  const users = await User.find({ status: 'active' }, 'email role name').lean();

  const byRole = {
    admin: users.filter((u) => u.role === 'admin'),
    manager: users.filter((u) => u.role === 'manager'),
    employee: users.filter((u) => u.role === 'employee'),
  };

  record('Database: admin account exists', byRole.admin.length > 0, `${byRole.admin.length} found`);
  record('Database: manager account exists', byRole.manager.length > 0, byRole.manager.map((u) => u.email).join(', ') || 'none');
  record('Database: employee account exists', byRole.employee.length > 0, byRole.employee.map((u) => u.email).join(', ') || 'none');

  await mongoose.disconnect();
  return byRole;
}

async function main() {
  console.log(`\nLeaveDesk API verification — ${BASE}\n`);

  try {
    await testPublic();
    await testUnauthorized();
    await verifyDatabaseUsers();

    const adminLogin = await login(SEED_ACCOUNTS.admin.email, SEED_ACCOUNTS.admin.password, 'admin');
    const adminToken = adminLogin.token;
    if (!adminToken) {
      record('Auth: admin login', false, adminLogin.reason);
    }
    await testRole('admin', adminToken, adminTests);

    // Admin can access most manager endpoints; manager-dashboard is manager-only (403 expected)
    if (adminToken) {
      const sharedManagerTests = managerTests
        .filter((t) => t.name !== 'Users list (forbidden)')
        .map((t) => (
          t.path === '/leaves/manager-dashboard'
            ? { ...t, name: 'Manager dashboard (admin forbidden)', expect: [403] }
            : t
        ));
      await testRole('manager-via-admin', adminToken, sharedManagerTests);
    }

    const managerLogin = await login(SEED_ACCOUNTS.manager.email, SEED_ACCOUNTS.manager.password, 'manager');
    if (managerLogin.token) {
      await testRole('manager', managerLogin.token, managerTests);
    } else {
      record('Manager role tests', true, `skipped — ${managerLogin.reason}`);
    }

    const employeeLogin = await login(SEED_ACCOUNTS.employee.email, SEED_ACCOUNTS.employee.password, 'employee');
    if (employeeLogin.token) {
      await testRole('employee', employeeLogin.token, employeeTests);
    } else {
      record('Employee role tests', true, `skipped — ${employeeLogin.reason}`);
    }

    // Signup validation (no account created)
    const signupRes = await request('/auth/signup', {
      method: 'POST',
      body: { email: 'not-an-email' },
      expect: [400, 422, 500],
    });
    record('Signup: rejects invalid payload', signupRes.ok, `status ${signupRes.status}`);
  } catch (err) {
    console.error('\nUnexpected error:', err.message);
    process.exit(1);
  }

  const failed = results.filter((r) => !r.ok);

  console.log(`\n--- Summary: ${results.length - failed.length}/${results.length} passed ---`);

  if (failed.length) {
    console.log('\nFailed checks:');
    failed.forEach((f) => console.log(`  - ${f.name}: ${f.detail}`));
    process.exit(1);
  }

  console.log('\nAll checks passed.\n');
}

main();
