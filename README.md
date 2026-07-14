LeaveDesk — Employee Leave Management Portal

A full-stack MERN application for managing employee leave requests, manager approvals, and HR administration. The UI brand is LeaveDesk; the repository folder is employee-leave-portal.

Tech Stack

- Frontend: React 18, Vite, Tailwind CSS, React Router, Recharts, Axios
- Backend: Node.js, Express.js
- Database: MongoDB with Mongoose
- Authentication: JWT in HTTP-only cookies with bcrypt password hashing
- File storage: Local disk by default; optional Cloudinary for cloud hosting

Features by Role

Employee
- Register publicly and wait for manager approval
- Dashboard with leave balance, pending requests, holidays, and announcements
- Profile management with photo upload
- Apply for leave (Annual, Sick, Casual, Work From Home)
- View leave history, notifications, and personal activity log

Manager
- Dashboard with team stats and pending leave requests
- Approve or reject employee accounts and leave requests
- View team employees, calendar, and profile activity
- Publish company announcements

Admin
- Full user management (employees, managers, admins)
- Department, leave policy, and holiday management
- Reports with analytics charts and CSV export
- Organization-wide profile activity and announcements

Project Structure

employee-leave-portal/
  package.json              Root scripts (dev, build, seed)
  README.md
  backend/
    .env.example            Environment template
    package.json
    uploads/                Local file storage (gitignored except .gitkeep)
    src/
      server.js             Server entry — starts HTTP listener
      app.js                Express app — middleware and route mounting
      config/               Environment, database, Cloudinary, constants
      models/               Mongoose schemas
      routes/               API route definitions (one file per resource)
      controllers/          Request handlers (one file per resource)
      middleware/           Auth, roles, upload, error handling
      services/             Business logic (auth, storage, notifications, activity)
      utils/                Helpers, JWT utilities, database seed script
  frontend/
    package.json
    vite.config.js          Dev proxy for /api and /uploads
    index.html
    public/                 Static assets (favicon)
    src/
      main.jsx              React entry point
      App.jsx               Auth loading gate
      index.css             Global styles and theme variables
      api/
        client.js           Axios instance with credentials
        index.js            API method groups (authAPI, userAPI, leaveAPI, etc.)
      routes/
        AppRoutes.jsx       All client-side routes
        ProtectedRoute.jsx  Auth and role guard
      context/
        AuthContext.jsx     Session state and login/signup actions
        ThemeContext.jsx    Light/dark theme
      hooks/
        useDashboardData.js Shared dashboard data fetching
      constants/
        brand.js            App name and branding
        pagination.js       Page size constants
      utils/
        helpers.js          Date, leave type, and formatting helpers
        activity.js         Activity feed display helpers
        announcements.js    Announcement label helpers
        dashboardExtras.js  Dashboard announcements and holidays fetch
      components/
        common/             Reusable UI (tables, modals, search, pagination)
        layout/             Shell, sidebar, notification bell, theme toggle
        dashboard/          Dashboard panels and stat cards
        activity/           Activity feed list and detail modal
        notifications/      Notification feed component
      pages/
        auth/               Login and registration (AuthPage.jsx)
        admin/              Admin-only pages
        manager/            Manager-only pages
        employee/           Employee-only pages
        shared/             Pages used by multiple roles

Backend Architecture

Request flow: routes → middleware (auth, role) → controllers → services/models → response

API base URL: http://localhost:5000/api

Mounted routes:
- /api/auth          Authentication (signup, login, logout, me)
- /api/users         User profiles, dashboard, team, pending approvals
- /api/leaves        Leave apply, review, history, calendar
- /api/departments   Department CRUD
- /api/policies      Leave policy configuration
- /api/holidays      Holiday management
- /api/notifications Notifications and announcements
- /api/reports       Analytics and CSV export
- /api/activities    Activity log (profile changes, leave actions)
- /api/health        Health check
- /uploads           Static local file serving

Frontend Architecture

- main.jsx wraps the app in BrowserRouter, ThemeProvider, and AuthProvider
- App.jsx shows a loading spinner until auth state is resolved, then renders AppRoutes
- AppRoutes.jsx defines every page route with ProtectedRoute role checks
- Layout.jsx provides the sidebar navigation (items vary by role)
- api/index.js centralizes all backend calls; Vite proxies /api to port 5000 in development

Getting Started

Prerequisites
- Node.js 18 or higher
- MongoDB running locally or a MongoDB Atlas connection string

1. Clone and install

cd employee-leave-portal
cd backend && npm install
cd ../frontend && npm install

2. Configure backend

cd backend
cp .env.example .env

Edit backend/.env with your MongoDB URI, JWT_SECRET, and optional Cloudinary keys. Do not commit .env — it is gitignored.

3. Seed the database

cd backend
npm run seed

4. Start the servers

Terminal 1 — backend:
cd backend
npm run dev

Terminal 2 — frontend:
cd frontend
npm run dev

Or from the project root:
npm run dev:backend
npm run dev:frontend

- API: http://localhost:5000
- App: http://localhost:5173

Default Seed Accounts

After running npm run seed:

Admin:    leavedesk123@gmail.com / leavedesk123
Manager:  manager@company.com / manager123
Employee: ali@company.com / employee123
Employee: ahmed@company.com / employee123
Pending:  sara@company.com (awaiting manager approval)

Login at /login. Use the Employee or Manager tab on the auth page. Admins can sign in from either tab.

File Storage

Privacy: nothing sensitive is stored in this repository. The backend/.env file and backend/uploads/ user files are gitignored. Each developer clones the project, creates their own .env from .env.example, and their uploads stay on their machine or their own Cloudinary account.

Local (default)
Profile pictures and leave attachments are saved in backend/uploads/ on your machine. The folder starts empty (only .gitkeep). Files are served at /uploads/... and proxied to the backend during development. No cloud account is required.

Cloudinary (optional)
Add your own credentials to backend/.env (never commit this file):

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

Use the Root API key from Cloudinary Dashboard → Settings → API Keys. Uploads use signed server-side uploads to leavedesk/profiles/ and leavedesk/attachments/ in your Cloudinary account. On startup the server logs "Cloudinary ready" when credentials are valid.

Application Flow

1. Employee or manager registers at /register
2. Account is created with pending status
3. Manager or admin approves the account (status becomes active)
4. User logs in and completes their profile
5. Employee applies for leave with optional attachment
6. Manager reviews and approves, rejects, or requests more info
7. Employee receives a notification; leave balance updates on approval

Environment Variables

PORT              Server port (default 5000)
MONGODB_URI       MongoDB connection string
JWT_SECRET        Secret key for JWT signing
JWT_EXPIRES_IN    Token expiry (default 7d)
CLIENT_URL        Frontend URL for CORS (default http://localhost:5173)
NODE_ENV          development or production
CLOUDINARY_*      Optional Cloudinary credentials (see File Storage)

Scripts

Root (package.json)
- npm run dev:backend     Start backend with auto-reload
- npm run dev:frontend    Start Vite dev server
- npm run start:backend   Start backend in production mode
- npm run build           Build frontend to frontend/dist/
- npm run seed            Seed MongoDB with sample data
- npm run verify          Run API tests, route checks, and production build

Backend (backend/package.json)
- npm run dev             Development server with --watch
- npm run start           Production server
- npm run seed            Populate database
- npm run verify          Test all API endpoints (server must be running)

Frontend (frontend/package.json)
- npm run dev             Vite dev server on port 5173
- npm run build           Production build
- npm run preview         Preview production build
- npm run verify          Check routes match navigation and page files exist

Verification Checklist

Run automated checks (backend must be running on port 5000):

npm run verify

This runs API endpoint tests, frontend route alignment checks, and a production build.

Manual checks:

1. Backend health: GET http://localhost:5000/api/health returns success
2. Frontend dev: http://localhost:5173 loads and proxies /api to the backend
3. Login: sign in as admin using your configured credentials
4. Employee flow: apply leave, view my leaves, check notifications
5. Manager flow: review pending employees and leave requests (danish@gmail.com in your DB)
6. Admin flow: manage departments, users, holidays, and reports
7. Search: use search bars and clear with the X icon on list pages
8. Profile upload: update profile picture (local or Cloudinary depending on .env)

Note: Seed accounts apply only after npm run seed. Your live database may use different accounts.

Production Notes

- Set NODE_ENV=production and a strong JWT_SECRET
- Build the frontend with npm run build and serve frontend/dist/ via a static host or reverse proxy
- Point CLIENT_URL to your production frontend URL
- Use MongoDB Atlas or a managed MongoDB instance
- For file storage in production, Cloudinary is recommended over local disk

License

MIT
