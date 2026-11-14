# EduSphere LMS

Full-stack Learning Management System for Admin, Faculty, and Student workspaces.

## Stack

- Frontend: React, Vite, Tailwind CSS, React Router, Axios, Context API, Lucide, Recharts
- Backend: Node.js, Express, MongoDB, Mongoose, JWT HTTP-only cookies, bcrypt, Multer
- Files: Cloudinary when credentials are set; otherwise local `uploads/`

## Setup

```bash
npm install
npm run install:all
npm run seed
npm run dev
```

- API: http://localhost:5000
- App: http://localhost:5173

MongoDB should be running at `mongodb://127.0.0.1:27017/edusphere`.

Optional Cloudinary keys go in `backend/.env`.

## Demo accounts

| Role    | Email                     | Password     |
| ------- | ------------------------- | ------------ |
| Admin   | admin@edusphere.com       | Admin@123    |
| Faculty | maya.chen@edusphere.com   | Faculty@123  |
| Student | noah.patel@edusphere.com  | Hell@123     |

## Creating accounts

- **Only administrators create accounts.** There is no public sign-up. Admins add, edit and deactivate students and faculty from **People → Add**.
- **Sign in with email or ID.** Students and faculty log in using their email *or* their assigned ID (`STU-…` / `FAC-…`) plus their password.
- **Change password:** any signed-in user can update their password from **Profile** (requires the current password).
- **Forgot password:** from the login page use **Forgot password?** (`/forgot-password`) to recover access in three steps — verify email/ID, enter the reset code, set a new password. Codes expire after 30 minutes. No mail service is configured, so in development the reset code is shown on screen; in production it would be emailed.
