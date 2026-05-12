# Team Task Manager

A beginner-friendly full-stack application for collaborative team task management.

## Project Overview

This is a complete full-stack project with a modern React frontend and Express.js backend, designed to help teams organize and track their work efficiently.

## Tech Stack

### Frontend

- **React 18** with Vite
- **Tailwind CSS** for styling
- **Firebase** for authentication
- **Axios** for API calls

### Backend

# Task Manager

## Project Overview

Task Manager is a full-stack team collaboration app for creating projects, assigning tasks, tracking status, and reviewing progress.

## Features

- Firebase authentication and protected routes
- Role-based access (Admin and User)
- Project and task management
- Task status workflow: Pending, In Progress, Completed
- Submission and feedback flow
- Dashboard and task/project detail pages

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, Axios, Firebase Web SDK
- Backend: Node.js, Express, MongoDB (Mongoose), Firebase Admin SDK

## Folder Structure

```text
Task-Manager/
|- client/
|  |- src/
|  |  |- components/
|  |  |- context/
|  |  |- layouts/
|  |  |- pages/
|  |  |- services/
|  |- index.html
|  |- package.json
|  |- vite.config.js
|  |- .env.example
|- server/
|  |- config/
|  |- controllers/
|  |- middleware/
|  |- models/
|  |- routes/
|  |- server.js
|  |- package.json
|  |- .env.example
|- README.md
```

## Installation Steps

1. Clone the repository.
2. Install client dependencies.
3. Install server dependencies.
4. Configure environment variables.

```bash
git clone <your-repo-url>
cd Task-Manager

cd client
npm install

cd ../server
npm install
```

## Environment Variables

### client/.env

Use [client/.env.example](client/.env.example) as reference.

- VITE_API_URL
- VITE_DEV_API_PROXY_TARGET (optional for local proxy)
- VITE_FIREBASE_API_KEY
- VITE_FIREBASE_AUTH_DOMAIN
- VITE_FIREBASE_PROJECT_ID
- VITE_FIREBASE_STORAGE_BUCKET
- VITE_FIREBASE_MESSAGING_SENDER_ID
- VITE_FIREBASE_APP_ID

### server/.env

Use [server/.env.example](server/.env.example) as reference.

- PORT
- NODE_ENV
- MONGODB_URI
- CORS_ORIGIN (comma-separated allowed origins)
- FIREBASE_SERVICE_ACCOUNT (JSON string for deployment environments)

## Run Commands

### Start backend

```bash
cd server
npm run dev
```

### Start frontend

```bash
cd client
npm run dev
```

### Production build (frontend)

```bash
cd client
npm run build
```

## User/Admin Roles

- Admin:
  - Create, edit, delete projects and tasks
  - Assign tasks and review submissions
  - Update task status
- User:
  - View assigned tasks and project data
  - Update task status for allowed tasks
  - Submit work and view feedback

## GitHub Setup

1. Ensure `.env` files are not committed.
2. Confirm `.gitignore` is applied.
3. Commit and push:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

## Vercel Deployment Steps

1. Push code to GitHub.
2. Create a new Vercel project and import the repository.
3. Set Vercel Root Directory to `client`.
4. Add client environment variables in Vercel Project Settings.
5. Set `VITE_API_URL` to your deployed backend URL, for example:
   - `https://your-backend-domain.com/api`
6. Build settings (default Vite values):
   - Build Command: `npm run build`
   - Output Directory: `dist`
7. Deploy.

Backend can be deployed separately (for example, Render, Railway, or another Node host). Then update `VITE_API_URL` in Vercel accordingly.

## License
