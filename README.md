# MUN Conference Platform

A comprehensive Model United Nations conference management platform with real-time communication, voting systems, and participant management.

## Features

- **Real-time Communication**: Live chat with moderation
- **Digital Voting System**: Secure voting with real-time results
- **Amendment Management**: Digital submission and approval workflow
- **Conference Dashboard**: Centralized management interface
- **Contribution Tracking**: Monitor delegate participation
- **Collaborative Notes**: Real-time note-taking and sharing
- **Centralized Database**: Access all conference materials

## Tech Stack

- **Backend**: Node.js, Express.js, Socket.IO
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with bcrypt
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Real-time**: Socket.IO for live updates

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- Git

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ShadowProphecyzer/MUN-Website.git
   cd MUN-Website
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   MONGO_URI=mongodb://localhost:27017/mun-website
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   PORT=5000
   NODE_ENV=development
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Main application: http://localhost:5000
   - Public pages: http://localhost:5000/public_access/homepage/homepage.html

## Project Structure

```
MUN-Website/
├── backend/                 # Backend server code
│   ├── config/             # Database configuration
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom middleware
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API routes
│   ├── utils/             # Utility functions
│   └── server.js          # Main server file
├── public/                # Main application frontend
│   ├── css/              # Stylesheets
│   ├── js/               # JavaScript files
│   └── index.html        # Main dashboard
├── public_access/         # Public marketing pages
│   ├── homepage/         # Landing page
│   ├── login/           # Login pages
│   ├── contact_us/      # Contact page
│   └── learn_more/      # Information page
└── package.json          # Dependencies and scripts
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Conference Management
- `GET /api/conference` - Get conferences
- `POST /api/conference` - Create conference
- `PUT /api/conference/:id` - Update conference
- `DELETE /api/conference/:id` - Delete conference

### Real-time Features
- Socket.IO events for live updates
- Chat messaging with moderation
- Real-time voting
- Amendment submissions
- Contribution tracking

## User Roles

1. **Owner**: Full system access
2. **Moderator**: Chat moderation, participant management
3. **Chair**: Conference control, voting management
4. **Delegate**: Basic participation, voting, notes

## Development

### Running in Development Mode
```bash
npm run dev
```

### Running in Production Mode
```bash
npm start
```

### Available Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests (to be implemented)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For support and questions, please contact us through the contact page or create an issue on GitHub.
