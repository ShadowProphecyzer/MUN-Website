# MUN Website Backend

This is a full-featured Model United Nations (MUN) conference management system with real-time updates, role-based access, and modular data isolation per conference.

---

## 1. Quick Start Guide

### 1.1 Clone the repository

```bash
git clone https://github.com/yourusername/MUN-Website.git
cd MUN-Website
```

### 1.2 Install backend dependencies

```bash
cd backend
npm install
```

All dependencies are listed in `backend/package.json`.

### 1.3 Configure environment variables

1. Create a file named `config.env` in `backend/`.
2. Example contents:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mun_website
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=360d
PORT=3000
NODE_ENV=development
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
LOGIN_MAX_ATTEMPTS=3
LOGIN_LOCK_DURATION=72000
GOD_EMAIL=goduser@example.com
```

This file is ignored by `.gitignore`. Do not commit secrets to version control.

### 1.4 Start the server

```bash
npm start
```

Server will run on `http://localhost:3000` by default. Static frontend files are served from `public/`.

### 1.5 Access the application

Open `http://localhost:3000` in your browser. The project includes authentication, conference management, real-time contributions tracking, and role-based access.

---

## 2. Project Overview

### 2.1 Directory structure

- `backend/` – Express server, API routes, models, services, middleware
  - `server.js` – Main server entry point with Socket.IO
  - `routes/` – All API endpoints
  - `models/` – Mongoose schemas
  - `services/` – Utility modules (e.g. dynamic DB connections, email)
  - `middleware/` – Authentication, validation, rate limiting
  - `scripts/` – Migration and utility scripts
- `public/` – Frontend static files (HTML, CSS, JS)
- `conferences/` – Auto-managed folders for each conference with separate `.env` for DB isolation

---

## 3. Core Features

### 3.1 Authentication and User Management

- JWT-based authentication with registration and login endpoints
- Password hashing, brute-force protection with account lockout
- Global and per-conference roles: god, owner, administrator, chair, delegate

### 3.2 Conference Management

- Create, list, and manage conferences
- Each conference has an isolated database configured automatically

### 3.3 Participants and Roles

- Add, remove, update participants with enforced role-based permissions

### 3.4 Live Contributions Tracking

- Real-time updates for delegate attendance, voting, POIs, amendments, and speeches using Socket.IO

### 3.5 Amendments Management

- Propose, review, and manage amendments with sequential IDs

### 3.6 Debate Panel

- Debate interface for adding notes; live voting planned

### 3.7 Email Notifications

- Automated emails for registration and contact form submissions via Nodemailer

### 3.8 Contact Form

- Stores contact form submissions and sends notification emails

### 3.9 User-Committee Tracking

- Tracks user participation across committees and conferences

---

## 4. Security

- Helmet for secure HTTP headers
- CORS enabled
- Rate limiting to prevent abuse
- Input validation and sanitisation on all routes
- JWT authentication with hashed passwords and lockout on multiple failed attempts

---

## 5. Upcoming Features

- Real-time note passing system
- Full debate panel workflow with timers and voting
- Centralised admin dashboard
- Mobile responsive UI enhancements
- Audit logs for security and transparency
- Bulk import/export of participants and data

---

## 6. Deployment Notes

- Copy environment variables to your hosting platform (e.g. Railway)
- Static frontend is served from the `public/` directory

---

## 7. API Reference

- All API endpoints are located in `backend/routes/`
- Models are defined in `backend/models/`
- Services are in `backend/services/`
- Middleware logic is in `backend/middleware/`

---

## 8. Screenshots

Below are placeholder screenshots for your documentation submission:

- `screenshot1.png` – Login page showing user authentication interface
- `screenshot2.png` – Conference management dashboard listing conferences
- `screenshot3.png` – Participant management page with role assignment options
- `screenshot4.png` – Real-time contributions tracking interface

Find these in the /screenshots folder
---

## 9. Screenshots Table

| File Name         | Description                                    |
|-------------------|------------------------------------------------|
| screenshot1.png   | Login page showing user authentication         |
| screenshot2.png   | Conference management dashboard                |
| screenshot3.png   | Participant management with role assignment    |
| screenshot4.png   | Real-time contributions tracking interface     | - screenshot without any delegate roles

---

## 10. Pre-submission Checklist Compliance

- Code is complete and functional; project runs with all core features after setup
- Easy to run locally with setup time under 2 minutes
- Experienceable build exists with working local server
- Well-documented README with setup, features, and API overview
- Polished and presentable with no major bugs or visual issues

---

For questions or contributions, open an issue or pull request.