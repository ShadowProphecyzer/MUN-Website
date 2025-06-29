# MUN Website Setup Test Guide

## Quick Setup Instructions

1. **Create Environment File**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your MongoDB connection:
   ```env
   MONGO_URI=mongodb://localhost:27017/mun-website
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   PORT=5000
   NODE_ENV=development
   ```

2. **Start MongoDB** (if using local MongoDB)
   ```bash
   # On Windows, start MongoDB service
   # Or use MongoDB Atlas for cloud database
   ```

3. **Start the Application**
   ```bash
   npm run dev
   ```

4. **Test the Application**
   - Open: http://localhost:5000
   - Should see the main dashboard (will redirect to login if not authenticated)
   - Open: http://localhost:5000/public_access/homepage/homepage.html
   - Should see the public homepage

## API Endpoints to Test

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)

### Test with curl:
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## Features Implemented

✅ **Backend**
- Express server with Socket.IO
- MongoDB connection with Mongoose
- JWT authentication
- User registration/login
- Role-based middleware
- Error handling

✅ **Frontend**
- Login/Register forms with API integration
- Dashboard with real-time stats
- Socket.IO client integration
- Responsive design

✅ **Real-time Features**
- WebSocket connections
- Chat messaging framework
- Voting system
- Amendment management
- Contribution tracking

## Next Steps

1. Set up MongoDB database
2. Test user registration/login
3. Create a conference
4. Test real-time features
5. Add more frontend functionality

## Troubleshooting

- **MongoDB Connection Error**: Make sure MongoDB is running or update MONGO_URI in .env
- **Port Already in Use**: Change PORT in .env file
- **Module Not Found**: Run `npm install` again 