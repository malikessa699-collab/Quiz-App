# QuizCraft — AI-Powered Quiz & Student Assessment Platform

A complete, production-minded full-stack web application where students can generate an
AI-powered quiz on **any topic**, take a real timed assessment, review correct answers and
explanations, receive an automatic **Pass / Fail** result, and track their preparation over
time with rich analytics.

Designed around a **Calm Focus** theme: a clean, light, distraction-free learning
environment with a Cadet Blue / Powder Blue palette, rounded cards, subtle shadows, and
smooth animations.

---

## ✨ Features

### Quiz Generator
- Enter **any topic** (Python, Maths, Biology, History, General Knowledge, …)
- Choose difficulty: **Easy / Medium / Hard**
- Choose question count: **5, 10, 15, 20, 30**
- Choose types: **MCQ, True/False, Short Answer**
- Optional grade / education level
- Fresh questions on every generation (AI-powered; built-in fallback when no API key)
- Rate limiting on generation; clear errors and a retry option

### Quiz Taking
- Overview screen with title, topic, marks, passing %, estimated time
- One question at a time with an animated progress bar
- Previous / Next navigation, question-number indicators, answer highlighting
- **Mark for review** flagging
- Optional countdown timer
- Confirmation dialog before submission (prevents accidental double submit)
- Two modes:
  - **Test Mode** — answers hidden until submission
  - **Practice Mode** — shows the correct answer + explanation after each question
- Automatic handling of unanswered questions (counted as incorrect)

### Results & Review
- Immediate automatic scoring (backend-computed, never trusted from the client)
- Score, percentage, pass/fail verdict, time taken
- Supportive feedback message and recommended next steps
- Full answer review with your answer, the correct answer, and an explanation

### Preparation Analytics & History
- Overall preparation %, averages, highest score, passed/failed counts
- Subject-wise performance, **weak topics** (below 70%) and **strong topics** (80%+)
- Score progression line chart, topic bar chart, pass/fail pie chart
- Insufficient-data messaging until enough attempts exist
- Paginated attempt history with detailed result views and delete

### Authentication & Administration
- Secure JWT auth, bcrypt password hashing, protected routes
- Student profiles (name, grade, institution, bio) and password change
- Role-based **Admin dashboard**: platform stats, user management,
  passing-percentage / timer / rate-limit settings

---

## 🧰 Tech Stack

| Layer     | Technology                                     |
|-----------|------------------------------------------------|
| Frontend  | React 18, Vite 5, React Router 6, Recharts 2   |
| Backend   | Node.js, Express 4                              |
| Database  | MongoDB with Mongoose (in-memory auto-fallback) |
| Auth      | JWT + bcryptjs                                  |
| AI        | OpenAI / Google Gemini REST (with fallback)     |

---

## 📁 Project Structure

```
Quiz App/
├── backend/
│   ├── src/
│   │   ├── config/          # env-based configuration
│   │   ├── controllers/     # route handlers
│   │   ├── db.js            # MongoDB connection + in-memory fallback
│   │   ├── middleware/      # auth, validation, errors, rate limiting
│   │   ├── models/          # Mongoose models
│   │   ├── routes/          # Express routers
│   │   ├── services/        # AI quiz generation, scoring, analytics
│   │   └── server.js        # Express entrypoint
│   ├── tests/               # Node test runner unit tests
│   ├── .env.example         # placeholder env template
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/      # layout + reusable UI
│   │   ├── context/         # AuthContext
│   │   ├── pages/           # all application pages
│   │   ├── services/        # API client
│   │   └── styles/          # Calm Focus design system (global.css)
│   ├── index.html
│   └── package.json
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ (tested with Node 24)
- **MongoDB is optional!** The backend first tries `MONGO_URI`; if MongoDB is not
  running, it **automatically starts an in-memory MongoDB** (via `mongodb-memory-server`)
  so the app works out of the box with zero database setup. For persistent data,
  install MongoDB (or use Atlas/Docker) — see [Database modes](#database-modes).
- *(Optional)* an **OpenAI** or **Gemini** API key for AI-generated quizzes

### 1. Clone & install

```bash
# Backend
cd backend
npm install
cp .env.example .env        # then edit .env with your values

# Frontend (in a second terminal)
cd ../frontend
npm install
```

### 2. Configure environment

Edit `backend/.env`:

```env
MONGO_URI=mongodb://127.0.0.1:27017/quizcraft
JWT_SECRET=some_long_random_string
```

**AI (optional).** Pick one provider and fill the key. When neither is set, the app
automatically uses the built-in question bank so quizzes still work offline.

```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
# OR
AI_PROVIDER=gemini
GEMINI_API_KEY=...
```

### 3. Run the backend

```bash
cd backend
npm run dev        # http://localhost:5000
```

> **First run with the in-memory fallback:** the first time the backend starts without
> a reachable MongoDB it downloads the `mongod` binary (~70 MB) and needs a few extra
> seconds. Subsequent starts are fast.

On first start the server automatically creates the bootstrap **admin account**
(defaults in `.env`):

```
Email:    admin@quizcraft.app
Password: Admin1234!
```

### 4. Run the frontend

```bash
cd frontend
npm run dev        # http://localhost:5173
```

Vite proxies `/api` requests to `http://localhost:5000`, so no extra config is needed.

---

## 🧪 Testing

Backend unit tests cover scoring, quiz generation validation, and analytics:

```bash
cd backend
npm test
```

Frontend production build check:

```bash
cd frontend
npm run build
```

---

## 🔌 API Overview

| Method | Endpoint                     | Auth  | Description                              |
|--------|------------------------------|-------|------------------------------------------|
| POST   | `/api/auth/register`         | —     | Create a student account                 |
| POST   | `/api/auth/login`            | —     | Log in, returns JWT                      |
| GET    | `/api/auth/me`               | JWT   | Current user                             |
| PATCH  | `/api/auth/profile`          | JWT   | Update profile                           |
| PATCH  | `/api/auth/password`         | JWT   | Change password                          |
| POST   | `/api/quizzes/generate`      | JWT   | Generate an AI quiz                      |
| GET    | `/api/quizzes/:id`           | JWT   | Get quiz with answer key                 |
| POST   | `/api/quizzes/:id/attempts`  | JWT   | Submit & score an attempt                |
| GET    | `/api/attempts/history`      | JWT   | Paginated attempt history                |
| GET    | `/api/attempts/:id`          | JWT   | Full attempt + answer review             |
| DELETE | `/api/attempts/:id`          | JWT   | Delete own attempt                       |
| GET    | `/api/analytics/summary`     | JWT   | Preparation summary                      |
| GET    | `/api/analytics/topics`      | JWT   | Subject-wise performance                 |
| GET    | `/api/analytics/timeline`    | JWT   | Chronological score chart data           |
| GET    | `/api/admin/stats`           | Admin | Platform statistics                      |
| GET    | `/api/admin/users`           | Admin | List users                               |
| PATCH  | `/api/admin/users/:id`       | Admin | Update role / activation                 |
| GET    | `/api/admin/settings`        | Admin | Get assessment settings                  |
| PATCH  | `/api/admin/settings`        | Admin | Update settings                          |

---

## 🔒 Security Notes

- Secrets live only in `backend/.env` (git-ignored); `.env.example` contains placeholders
- Passwords hashed with bcrypt; never returned by the API
- JWT-protected routes with role-based authorization for admin endpoints
- Rate limiting on authentication and quiz generation
- Input validation and sanitization on all routes
- AI output is parsed as structured JSON, validated, and stored — never executed as code
- Final scores are always computed and validated by the backend

---

## 🛠 Troubleshooting

- **Site won't load / API unreachable** — the backend must be running, then the frontend:
  1. Start the backend: `cd backend && npm run dev` (listens on `http://localhost:5000`).
  2. Start the frontend in a second terminal: `cd frontend && npm run dev`
     (open `http://localhost:5173`).
- **MongoDB connection error on startup** — this is handled automatically: if the
  configured `MONGO_URI` can't be reached, the backend starts an in-memory MongoDB and
  logs `Database mode: IN-MEMORY (automatic fallback)`. Data resets on restart.
- **AI generation fails** — the backend logs a warning and falls back to the built-in
  generator, so the app still works. Double-check `AI_PROVIDER` and the API key.
- **Frontend can't reach API** — confirm the backend is on port 5000 (Vite proxies
  `/api` there). For a deployed setup, set `VITE_API_URL` in `frontend/.env`.
- **Port in use** — change `PORT` in `backend/.env` and update the proxy target in
  `frontend/vite.config.js`.

---

## 💾 Database Modes

| Mode      | When it's used                                  | Persistence                     |
|-----------|-------------------------------------------------|---------------------------------|
| External  | `MONGO_URI` points at a reachable MongoDB       | Persistent (your data is kept)  |
| In-memory | MongoDB is not installed / not reachable        | Ephemeral (resets on restart)   |

To use persistent data, pick one of:

- **Install MongoDB Community Server** (create a Windows service) and keep the default
  `MONGO_URI=mongodb://127.0.0.1:27017/quizcraft`.
- **Run MongoDB in Docker:** `docker run -d -p 27017:27017 --name quizcraft-mongo mongo`
- **Use MongoDB Atlas** and paste your connection string into `MONGO_URI` in
  `backend/.env`.

---

## ☁️ Deploying to Vercel

This project is pre-configured for **Vercel** (frontend + backend in one deployment).

### How it works

- `vercel.json` — rewrites `/api/*` to the serverless function and SPA fallback
  for all other routes.
- `api/index.js` — the serverless entry point. It lazily connects to MongoDB
  (cached across warm invocations) and mounts the existing Express app.
- Root `package.json` — installs backend deps for the serverless function and
  builds the frontend into `frontend/dist`.

### 1. Push to GitHub (already done)

```bash
git add .
git commit -m "prepare for Vercel"
git push -u origin main
```

### 2. Import on Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and **Import** your GitHub repo
   (`malikessa699-collab/Quiz-App`).
2. Vercel auto-detects Vite. Confirm:
   - **Build Command:** `npm run build`
   - **Output Directory:** `frontend/dist`
3. Click **Deploy**.

### 3. Add environment variables

> ⚠️ **`MONGO_URI` is REQUIRED on Vercel.** Unlike local development, the
> in-memory MongoDB fallback is **disabled** in serverless, so a missing or
> local-only value (e.g. `mongodb://127.0.0.1:27017/quizcraft`) causes every
> `/api` request to fail with `Database connection failed`. Use a hosted
> MongoDB (MongoDB Atlas is free on the M0 tier) and paste its connection
> string here.

In the Vercel project → **Settings → Environment Variables**, add for
**Production** (and Preview/Development as needed):

| Name                | Example                                                          |
|---------------------|------------------------------------------------------------------|
| `MONGO_URI`         | `mongodb+srv://user:pass@cluster.mongodb.net/quizcraft`         |
| `JWT_SECRET`        | `a_long_random_secret_string`                                    |
| `JWT_EXPIRES_IN`    | `7d`                                                             |
| `AI_PROVIDER`       | `openai` / `gemini` (or leave blank for built-in fallback)      |
| `OPENAI_API_KEY`    | `sk-...` (only if using OpenAI)                                  |
| `GEMINI_API_KEY`    | `...` (only if using Gemini)                                     |
| `ADMIN_NAME`        | `Administrator`                                                  |
| `ADMIN_EMAIL`       | `admin@quizcraft.app`                                            |
| `ADMIN_PASSWORD`    | `YourAdminPassword`                                              |
| `VITE_API_URL`      | *(optional)* Set to your deployed URL if you use an absolute API path |

Then redeploy (Vercel redeploys automatically when env vars change).

> ⚠️ **Never** put secrets in the frontend bundle. `MONGO_URI`, `JWT_SECRET`, and
> API keys only belong in Vercel's environment variables (backend/serverless scope),
> never in `VITE_*` variables (which are exposed to the browser).

### 4. Verify

- Your app is live at `https://<your-project>.vercel.app`
- Backend health check: `https://<your-project>.vercel.app/api/health`
  → expect `{"success":true,"status":"ok",...}`
- Register a user — data persists in MongoDB Atlas.

### Local dev still works

- `cd backend && npm run dev` → API on `http://localhost:5000`
- `cd frontend && npm run dev` → UI on `http://localhost:5173` (proxies `/api` to 5000)