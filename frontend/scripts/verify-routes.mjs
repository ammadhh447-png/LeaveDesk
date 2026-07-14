/**
 * Verifies frontend nav paths and AppRoutes are aligned.
 * Usage: node scripts/verify-routes.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcRoot = path.join(__dirname, '../src');

const navPaths = [
  '/dashboard', '/leave-balance', '/apply-leave', '/my-leaves', '/my-activity',
  '/leave-history', '/company-announcements', '/notifications',
  '/leave-requests', '/team-employees', '/pending-employees', '/team-calendar',
  '/team-activity', '/announcements', '/employees', '/departments',
  '/leave-policy', '/holidays', '/reports', '/profile', '/login', '/register',
];

const appRoutes = fs.readFileSync(path.join(srcRoot, 'routes/AppRoutes.jsx'), 'utf8');
const missing = navPaths.filter((p) => !appRoutes.includes(`path="${p}"`));

if (missing.length) {
  console.error('Missing routes in AppRoutes.jsx:', missing.join(', '));
  process.exit(1);
}

const pageImports = [...appRoutes.matchAll(/from '\.\.\/pages\/[^']+'/g)].map((m) => m[0]);
const uniqueImports = [...new Set(pageImports)];

let broken = 0;
for (const imp of uniqueImports) {
  const rel = imp.replace("from '../pages/", '').replace("'", '');
  const candidates = [
    path.join(srcRoot, 'pages', `${rel}.jsx`),
    path.join(srcRoot, 'pages', rel, 'index.jsx'),
  ];
  if (!candidates.some((c) => fs.existsSync(c))) {
    console.error(`Missing page file for import: ${rel}`);
    broken += 1;
  }
}

if (broken) process.exit(1);

console.log(`Route verification passed (${navPaths.length} paths, ${uniqueImports.length} page imports).`);
