# MUN Website Backend

A full-featured Model United Nations (MUN) conference management system with real-time updates, role-based access, and modular conference data isolation.

---

## 🚀 Setup Instructions

### 1. **Clone the Repository**
```bash
git clone https://github.com/yourusername/MUN-Website.git
cd MUN-Website
```

### 2. **Install Dependencies**
```bash
cd backend
npm install
```
- All backend dependencies are listed in [`backend/package.json`](backend/package.json).

### 3. **Configure Environment Variables**
- Create a file named `config.env` inside the `backend/` directory.
- Example contents (see [`backend/config.env`](backend/config.env)):
  ```env
  # MongoDB Connection
  MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mun_website

  # Email Configuration (Gmail App Password)
  EMAIL_USER=your_email@gmail.com
  EMAIL_PASS=your_gmail_app_password

  # JWT Configuration
  JWT_SECRET=your-super-secret-jwt-key
  JWT_EXPIRES_IN=360d

  # Server Configuration
  PORT=3000
  NODE_ENV=development

  # Rate Limiting
  RATE_LIMIT_WINDOW_MS=900000
  RATE_LIMIT_MAX_REQUESTS=1000

  # Authentication Settings
  LOGIN_MAX_ATTEMPTS=3
  LOGIN_LOCK_DURATION=72000

  # God Email for Conference System
  GOD_EMAIL=goduser@example.com
  ```
- **Place this file in `backend/` only.**  
- **Never commit this file to git.** It is ignored by `.gitignore`.

### 4. **Start the Server**
```bash
npm start
```
- The backend will run on `http://localhost:3000` by default.
- Static files are served from the [`public/`](public/) directory.

### 5. **Frontend**
- All HTML, CSS, and JS files for the frontend are in [`public/`](public/).
- Open `http://localhost:3000` in your browser to access the app.

---

## 🗄️ **Project Structure Overview**

- **backend/**
  - [`server.js`](backend/server.js): Main Express server, static file serving, API routing, and Socket.IO setup.
  - [`config.env`](backend/config.env): Environment variables (see above).
  - [`routes/`](backend/routes/): All API endpoints (see below).
  - [`models/`](backend/models/): Mongoose schemas for all data types.
  - [`services/`](backend/services/): Utility modules (e.g., `getConferenceDb.js` for dynamic DB connections, `emailService.js` for email).
  - [`middleware/`](backend/middleware/): Auth, validation, and rate limiting.
  - [`scripts/`](backend/scripts/): Migration and utility scripts.
- **public/**: All static frontend files (HTML, CSS, JS).
- **conferences/**: Each conference gets its own folder and `.env` file for DB isolation (auto-managed).

---

## ⚙️ **How Conference Data Isolation Works**

- When a new conference is created (see [`backend/routes/conference.js`](backend/routes/conference.js)), a new folder and `.env` file are created in `conferences/`.
- The `.env` file for each conference contains a `MONGODB_URI` that points to a unique database on the same MongoDB cluster as your main `MONGODB_URI`.
- All conference-specific data (participants, amendments, contributions, etc.) is stored in that database, managed by [`backend/services/getConferenceDb.js`](backend/services/getConferenceDb.js).
- The logic for creating and connecting to these databases is in [`getConferenceDb.js`](backend/services/getConferenceDb.js) and the conference creation route in [`conference.js`](backend/routes/conference.js).

---

## ✨ **Feature Descriptions**

### **Authentication & User Management**
- **Endpoints:** [`backend/routes/auth.js`](backend/routes/auth.js)
- **Schema:** [`backend/models/User.js`](backend/models/User.js)
- JWT-based authentication, registration, login, and password hashing.
- Rate limiting and account lockout for brute-force protection.
- User roles are managed globally and per-conference (see [`Participant.js`](backend/models/Participant.js)).

### **Conference Management**
- **Endpoints:** [`backend/routes/conference.js`](backend/routes/conference.js)
- Create, list, and manage conferences. Each conference is isolated in its own database.
- Conference creation logic also sets up initial participants and database structure.

### **Participants & Roles**
- **Endpoints:** [`backend/routes/participants.js`](backend/routes/participants.js), [`backend/routes/participantsV2.js`](backend/routes/participantsV2.js)
- **Schema:** [`backend/models/Participant.js`](backend/models/Participant.js)
- Add, remove, and update participants with roles: god, owner, administrator, chair, delegate, etc.
- Role-based access control for all sensitive actions, enforced in each route.
- Locking logic for GOD/Owner/Admin roles is in the participant schema and routes.

### **Live Contributions Tracking**
- **Endpoints:** [`backend/routes/contributions.js`](backend/routes/contributions.js)
- **Schema:** [`backend/models/Contribution.js`](backend/models/Contribution.js)
- Real-time updates for delegate attendance, voting, POIs, amendments, and speeches via Socket.IO.
- Contributions are tied to both conference and country.

### **Amendments**
- **Endpoints:** [`backend/routes/amendments.js`](backend/routes/amendments.js)
- **Schema:** [`backend/models/Amendment.js`](backend/models/Amendment.js)
- Propose, review, and manage amendments per conference, with role-based permissions.
- Amendment IDs are sequential per conference.

### **Debate Panel**
- **Frontend:** [`public/debate.html`](public/debate.html), [`public/debate.js`](public/debate.js)
- Participate in debates, add notes, and (planned) live voting.
- Modal UI for adding debate notes.

### **Note Passing** (Planned)
- Real-time note passing between delegates and chairs (coming soon).

### **PDF Reports**
- **Service:** [`backend/services/emailService.js`](backend/services/emailService.js) (for email), PDF generation via `pdfkit`.
- Downloadable reports for conference data (planned for future).

### **Email Notifications**
- Automated emails for registration, contact form, and notifications using Nodemailer.
- Email logic is in [`emailService.js`](backend/services/emailService.js).

### **User-Committee Tracking**
- **Endpoints:** [`backend/routes/userCommittees.js`](backend/routes/userCommittees.js)
- Track which users are in which committees/conferences.
- Used for dashboard and quick access to user’s conferences.

### **Contact Form**
- **Endpoints:** [`backend/routes/contact.js`](backend/routes/contact.js)
- **Schema:** [`backend/models/Contact.js`](backend/models/Contact.js)
- Stores contact form submissions and sends email notifications.

### **Security**
- **Middleware:** [`backend/middleware/auth.js`](backend/middleware/auth.js), [`backend/middleware/validation.js`](backend/middleware/validation.js), [`backend/middleware/rateLimiter.js`](backend/middleware/rateLimiter.js)
- Helmet for HTTP headers, CORS, input validation, and rate limiting.
- All sensitive routes require authentication and proper roles.

### **Frontend Navigation and Dynamic Content**
- **Homepage navigation bar and submenu:**
  - See [`public/homepage.html`](public/homepage.html) and [`public/homepage.js`](public/homepage.js).
  - The submenu (category bar) is fully dynamic and updates the showcase section based on user clicks.
  - All selectors and event handlers are CSP-compliant and robust.

---

## 🛠 **Upcoming Features**

- **Note Passing System:** Real-time note passing between delegates and chairs.
- **Debate Panel Enhancements:** Full debate workflow, timers, and voting.
- **Admin Dashboard:** Centralized management for all conferences and users.
- **Mobile Responsive UI:** Improved experience on mobile devices.
- **Audit Logs:** Track changes and actions for security and transparency.
- **Bulk Import/Export:** CSV/Excel import/export for participants and data.

---

## 📝 **Additional Notes**

- The `config.env` file **must be placed in the `backend/` directory** and should never be committed to version control.
- The app is designed to work with **any MongoDB connection string**. All conference-specific data is automatically stored in separate databases on the same MongoDB server/cluster.
- For deployment (e.g., Railway), copy all variables from `config.env` into your platform's environment variable settings.
- Static files are served from the [`public/`](public/) directory. See [`backend/server.js`](backend/server.js) for details.
- Conference-specific databases are managed automatically. See [`backend/services/getConferenceDb.js`](backend/services/getConferenceDb.js) for details.
- For migration scripts and utilities, see [`backend/scripts/`](backend/scripts/).

---

## 📚 **API Reference**

- All API endpoints are defined in [`backend/routes/`](backend/routes/).
- See each file for detailed endpoint documentation and logic.
- Data models are in [`backend/models/`](backend/models/).
- Utility and service logic is in [`backend/services/`](backend/services/).
- Middleware for security and validation is in [`backend/middleware/`](backend/middleware/).

---

For questions or contributions, please open an issue or pull request!
