# LeaveDesk — Employee Leave Management Portal


---

##  Overview

LeaveDesk is a full-stack MERN Employee Leave Management Portal that enables employees to apply for leave, managers to approve requests, and administrators to manage departments, holidays, reports, and organization settings.

---

#  Tech Stack

| Category | Technology |
|-----------|------------|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Authentication | JWT + HTTP-only Cookies |
| Password Hashing | bcrypt |
| Charts | Recharts |
| HTTP Client | Axios |
| Storage | Local Uploads / Cloudinary |

---

#  User Roles

| Employee | Manager | Admin |
|-----------|----------|--------|
| Apply Leave | Approve Leave | Manage Users |
| Leave History | Team Dashboard | Departments |
| Notifications | Calendar | Leave Policies |
| Profile | Announcements | Holidays |
| Activity Log | Employee Approval | Reports |

---

#  Features

| Module | Features |
|---------|----------|
| Authentication | Login, Register, Logout, JWT |
| Dashboard | Stats, Holidays, Announcements |
| Leave | Apply, Approve, Reject |
| Reports | Analytics, CSV Export |
| Notifications | Real-time Updates |
| Profile | Photo Upload |
| Departments | CRUD |
| Policies | Leave Configuration |

---

#  Project Structure

```text
employee-leave-portal
│
├── backend
│   ├── controllers
│   ├── middleware
│   ├── models
│   ├── routes
│   ├── services
│   └── utils
│
├── frontend
│   ├── components
│   ├── pages
│   ├── hooks
│   ├── context
│   └── api
│
└── README.md
```

---

#  API Endpoints

| Endpoint | Description |
|-----------|-------------|
| /api/auth | Authentication |
| /api/users | User Management |
| /api/leaves | Leave Requests |
| /api/departments | Departments |
| /api/policies | Leave Policies |
| /api/holidays | Holidays |
| /api/reports | Reports |
| /api/notifications | Notifications |

---

#  Getting Started

| Step | Command |
|------|---------|
| Install Backend | `cd backend && npm install` |
| Install Frontend | `cd frontend && npm install` |
| Seed Database | `npm run seed` |
| Run Backend | `npm run dev` |
| Run Frontend | `npm run dev` |

---

#  Scripts

| Script | Purpose |
|--------|---------|
| npm run dev | Development |
| npm run build | Production Build |
| npm run seed | Seed Database |
| npm run verify | Project Verification |

---

#  Environment Variables

| Variable | Description |
|----------|-------------|
| PORT | Server Port |
| MONGODB_URI | MongoDB URI |
| JWT_SECRET | Secret Key |
| CLIENT_URL | Frontend URL |
| CLOUDINARY_* | Cloudinary Credentials |

---

# 📄 License

MIT License
