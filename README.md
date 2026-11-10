# 🍽️ IIIT Bhubaneswar – Mess Hub

**A Full-Stack MERN Mess Management System**

**Link-https://peppy-dolphin-668b80.netlify.app/**
**Project Explanation Video-https://drive.google.com/drive/folders/1qr534tzOAkrLHtXV1gNJWqbDGl30pu9M?usp=sha
ring**

A centralized digital mess management platform designed for IIIT Bhubaneswar to simplify meal booking, wallet management, payment approvals, and daily mess operations.

Built using the **MERN Stack (MongoDB, Express.js, React.js, and Node.js)**, Mess Hub provides dedicated dashboards for students and mess administrators, ensuring transparent, secure, and efficient mess management.

---

## ✨ Key Features

### 👨‍🎓 Student Portal
- **Secure Authentication:** JWT-based login and student self-registration.
- **Meal Management:** View daily and weekly menus.
- **Meal Booking:** Book, skip, and re-book meals.
- **Wallet Management:** View wallet balance and transaction history.
- **Wallet Top-ups:** Submit requests to add money to the wallet.
- **Meal Feedback:** Submit feedback about meals.
- **Smart Restrictions:** Meal skipping closes 2 hours before the scheduled meal.

### 🏢 Mess Administration
- **Admin Dashboard:** Monitor wallet funds, student balances, and meal statistics.
- **Student Management:** View student accounts and suspend or activate users.
- **Menu Management:** Update the weekly menu (Head Admin).
- **Payment Approvals:** Review and approve or reject wallet top-up requests.
- **Cash Credits:** Manually credit student wallets.
- **Audit Logs:** Track administrative activities and transactions.
- **Meal Statistics:** Compare expected meals against actual served meals.

### 🍛 Counter Management
- Search students using their roll numbers.
- Verify student eligibility before serving meals.
- Prevent duplicate meal servings.
- Automatically reject skipped meals.
- Block meal serving for suspended accounts or insufficient wallet balances.

### 🔐 Security & Reliability
- JWT-based authentication with 8-hour sessions.
- Password hashing using bcrypt.
- Role-based access control (RBAC).
- Login rate limiting.
- Helmet security middleware.
- CORS origin restrictions.
- Request payload size limits.
- Input validation and centralized error handling.
- Atomic wallet transactions to prevent invalid balance updates.
- Prevention of duplicate meal serving.

---

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| Frontend | React.js, Vite, CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Authentication | JWT, bcrypt |
| Security | Helmet, CORS, Rate Limiting |
| Development | Docker, npm, Concurrently |

---

## 📂 Project Structure

```text
Mess-Management-System/
│
├── client/
│   └── src/
│       ├── App.jsx
│       ├── pages.jsx
│       ├── staff.jsx
│       ├── api.js
│       ├── ctx.js
│       ├── util.js
│       └── styles.css
│
├── server/
│   └── src/
│       ├── config.js
│       ├── models.js
│       ├── auth.js
│       ├── routes.js
│       ├── seed.js
│       └── index.js
│
├── docker-compose.yml
├── package.json
└── README.md
```

---

## 🚀 Getting Started

Follow these instructions to run the project locally.

### Prerequisites

Make sure you have installed:

- [Node.js](https://nodejs.org/) (Version 18 or newer)
- [MongoDB](https://www.mongodb.com/) (Local installation or MongoDB Atlas)
- [Docker](https://www.docker.com/) (Optional)
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Ommdutta26/Mess-Management-System.git

cd Mess-Management-System
```

### 2. Start MongoDB

To start MongoDB using Docker:

```bash
docker compose up -d
```

Alternatively, use a locally installed MongoDB instance or a MongoDB Atlas connection string.

### 3. Install Dependencies

Install the root dependencies:

```bash
npm install
```

Install frontend and backend dependencies:

```bash
npm run install:all
```

### 4. Configure Environment Variables

Create your backend environment file:

**Linux / macOS:**
```bash
cp server/.env.example server/.env
```

**Windows PowerShell:**
```powershell
Copy-Item server/.env.example server/.env
```

Configure the following variables inside `server/.env`:

```env
MONGO_URI=mongodb://127.0.0.1:27017/mess_hub

JWT_SECRET=your_long_random_secret_key

CLIENT_ORIGIN=http://localhost:5173

MIN_BALANCE=0

PORT=5000
```

**Important:** Generate a strong, unique JWT secret and never commit your `.env` file to GitHub.

### 5. Seed the Database

Load demo student accounts, staff accounts, and the weekly menu:

```bash
npm run seed
```

### 6. Run the Application

Start both frontend and backend:

```bash
npm run dev
```

The application will be available at:

| Service | URL |
|---|---|
| React Frontend | http://localhost:5173 |
| Express Backend | http://localhost:5000 |
| API Base URL | http://localhost:5000/api |

The Vite development server automatically proxies `/api` requests to the backend.

---

## 🔑 Demo Credentials

Use the following credentials after running the database seed script.

| Role | User ID | Password |
|---|---|---|
| Student | B2024CSE045 | student@123 |
| Student | B2024ECE012 | student@123 |
| Student | B2023IT033 | student@123 |
| Head Admin | ADMIN | admin@123 |
| Counter Staff | COUNTER01 | staff@123 |
| Accountant | ACCOUNTS01 | staff@123 |

**Note:** Staff members should use the **Mess Office** tab to sign in. These are development credentials only. Change all default passwords before production deployment.

---

## 🔌 API Documentation

All API endpoints are prefixed with `/api`.

Protected routes require a valid JWT token:

```http
Authorization: Bearer <token>
```

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register a student |
| POST | `/auth/login` | Authenticate user |
| GET | `/me` | Get current user |
| GET | `/config` | Get application configuration |

### Menu & Meal Management

| Method | Endpoint | Description |
|---|---|---|
| GET | `/menu` | Get menu |
| PUT | `/menu` | Update menu (Head) |
| GET | `/skips` | Get skipped meals |
| POST | `/skips/toggle` | Skip or re-book a meal |
| GET | `/notices` | Get notices |
| POST | `/notices` | Create notice (Head) |

### Wallet & Payments

| Method | Endpoint | Description |
|---|---|---|
| GET | `/wallet` | Get wallet details |
| POST | `/topups` | Submit top-up request |
| GET | `/topups` | View top-up requests |
| POST | `/topups/:id/decide` | Approve or reject top-up |

### Administration

| Method | Endpoint | Description |
|---|---|---|
| GET | `/admin/overview` | Dashboard statistics |
| GET | `/admin/students` | List students |
| POST | `/admin/staff` | Create staff account (Head) |
| POST | `/admin/students/:id/credit` | Credit student wallet |
| POST | `/admin/students/:id/toggle` | Suspend or activate student |
| GET | `/admin/audit` | View audit logs |

### Counter Operations

| Method | Endpoint | Description |
|---|---|---|
| POST | `/counter/serve` | Record meal serving |
| GET | `/counter/today` | View today's serving records |

### Feedback

| Method | Endpoint | Description |
|---|---|---|
| POST | `/feedback` | Submit meal feedback |
| GET | `/feedback` | Retrieve meal feedback |

---

## 💳 Wallet & Transaction Safety

Mess Hub implements safeguards to ensure reliable financial operations:

1. Students submit wallet top-up requests instead of directly modifying their balances.
2. Accountants or authorized administrators approve or reject top-up requests.
3. Meal charges are performed using atomic database updates.
4. Wallet balances cannot fall below the configured minimum balance.
5. A student cannot be charged twice for the same meal on the same day.
6. Suspended accounts and students with insufficient balances cannot receive meals.

These safeguards help maintain financial transparency and prevent inconsistent wallet transactions.

---

## 🌐 Production Deployment

Before deploying the application:

1. Configure a production MongoDB database using MongoDB Atlas.
2. Set a strong production `JWT_SECRET`.
3. Configure `CLIENT_ORIGIN` with your deployed frontend URL.
4. Install all dependencies.
5. Build the React frontend.
6. Deploy the backend using a Node.js hosting service.
7. Deploy the frontend using a static hosting service or CDN.
8. Enable HTTPS and verify production environment variables.

Build the frontend:

```bash
npm run build
```

Start the backend:

```bash
npm start --prefix server
```

Ensure the backend serves the API over HTTPS and the frontend is configured to communicate with the deployed API.

---

## 🚧 Future Enhancements

The following features from the earlier browser-based prototype are yet to be integrated into the MERN application:

- Polls, feasts, and event management.
- Guest passes and leave planner.
- Kitchen inventory and stock management.
- Student help desk.
- Notification system.
- Monthly printable mess bills.
- Analytics dashboards and charts.
- Dietary preference filters.
- Dark mode.
- Online payment gateway integration.
- Automated testing and refresh-token authentication.
- Dedicated staff account management screens.

---

## 🎯 Project Objective

Mess Hub aims to modernize traditional hostel mess operations at IIIT Bhubaneswar by replacing manual processes with a centralized digital platform.

It provides students with greater control over their meals and finances while enabling mess administrators and staff to manage daily operations efficiently, securely, and transparently.

---

**Developed with ❤️ using the MERN Stack**

*IIIT Bhubaneswar – Mess Management System*
