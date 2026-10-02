# Event Management System - Backend Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (running locally or MongoDB Atlas)
- npm or yarn

### Installation Steps

1. **Navigate to backend folder:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **MongoDB Setup:**
   
   **Option A: Local MongoDB**
   - Make sure MongoDB is running on your machine
   - Default: `mongodb://localhost:27017/event_management`
   
   **Option B: MongoDB Atlas (Cloud)**
   - Create an account at https://www.mongodb.com/cloud/atlas
   - Create a cluster and get your connection string
   - Update `.env` file with your connection URI

4. **Configure Environment Variables:**
   Edit `.env` file:
   ```
   MONGODB_URI=mongodb://localhost:27017/event_management
   JWT_SECRET=your_jwt_secret_key_change_this_in_production
   NODE_ENV=development
   PORT=3000
   SESSION_SECRET=your_session_secret_key_change_this_in_production
   ```

5. **Start the server:**
   
   Development mode (with auto-reload):
   ```bash
   npm run dev
   ```
   
   Production mode:
   ```bash
   npm start
   ```

   Server will start at: `http://localhost:3000`

---

## 📁 Project Structure

```
backend/
├── server.js                 # Main server file
├── package.json             # Dependencies
├── .env                     # Environment variables
├── models/
│   └── User.js              # User database schema
├── routes/
│   ├── auth.js              # Authentication routes
│   └── users.js             # User profile routes
└── middleware/
    └── auth.js              # Authentication middleware
```

---

## 🔐 Features Implemented

### Authentication
- ✅ User Registration with validation
- ✅ User Login with password verification
- ✅ Logout functionality
- ✅ JWT token generation & verification
- ✅ Session management
- ✅ "Remember me" functionality (30-day session)
- ✅ Login history tracking
- ✅ Password hashing with bcryptjs

### User Management
- ✅ User profile retrieval
- ✅ Profile update (name, company)
- ✅ Change password
- ✅ Delete account
- ✅ View login history

---

## 📡 API Endpoints

### Authentication Routes (`/api/auth`)

**Register User**
```
POST /api/auth/register
Content-Type: application/json

{
  "full_name": "John Doe",
  "email": "john@example.com",
  "company": "Tech Corp",
  "password": "SecurePass123",
  "confirm_password": "SecurePass123"
}

Response:
{
  "success": true,
  "message": "Registration successful",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "fullName": "John Doe",
    "email": "john@example.com",
    "company": "Tech Corp"
  }
}
```

**Login User**
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123",
  "remember": true
}

Response:
{
  "success": true,
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "fullName": "John Doe",
    "email": "john@example.com",
    "company": "Tech Corp",
    "lastLogin": "2024-01-15T10:30:00Z"
  }
}
```

**Logout User**
```
POST /api/auth/logout

Response:
{
  "success": true,
  "message": "Logout successful"
}
```

**Check Auth Status**
```
GET /api/auth/status
Authorization: Bearer jwt_token_here

Response:
{
  "success": true,
  "authenticated": true,
  "user": {
    "id": "user_id",
    "fullName": "John Doe",
    "email": "john@example.com",
    "company": "Tech Corp"
  }
}
```

**Get Login History**
```
GET /api/auth/login-history
Authorization: Bearer jwt_token_here

Response:
{
  "success": true,
  "loginHistory": [
    {
      "_id": "history_id",
      "timestamp": "2024-01-15T10:30:00Z",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0..."
    }
  ]
}
```

### User Routes (`/api/users`)

**Get User Profile**
```
GET /api/users/profile
Authorization: Bearer jwt_token_here

Response:
{
  "success": true,
  "user": {
    "id": "user_id",
    "fullName": "John Doe",
    "email": "john@example.com",
    "company": "Tech Corp",
    "createdAt": "2024-01-10T12:00:00Z",
    "lastLogin": "2024-01-15T10:30:00Z",
    "isVerified": true
  }
}
```

**Update User Profile**
```
PUT /api/users/profile
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "fullName": "John Updated",
  "company": "New Corp"
}

Response:
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "id": "user_id",
    "fullName": "John Updated",
    "email": "john@example.com",
    "company": "New Corp"
  }
}
```

**Change Password**
```
POST /api/users/change-password
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "currentPassword": "OldPass123",
  "newPassword": "NewPass456",
  "confirmPassword": "NewPass456"
}

Response:
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Delete Account**
```
DELETE /api/users/account
Authorization: Bearer jwt_token_here

Response:
{
  "success": true,
  "message": "Account deleted successfully"
}
```

---

## 🔌 Frontend Integration

The frontend files (login.html and register.html) should include the `auth.js` file:

```html
<script src="auth.js"></script>
```

The `auth.js` file handles:
- Form validation
- API communication
- Token management
- User session handling
- Automatic redirects

---

## 🗄️ Database Schema

### User Schema
```javascript
{
  _id: ObjectId,
  fullName: String (required),
  email: String (required, unique),
  company: String (required),
  password: String (hashed, required),
  isVerified: Boolean (default: false),
  verificationToken: String,
  lastLogin: Date,
  loginHistory: [
    {
      timestamp: Date,
      ipAddress: String,
      userAgent: String
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🛡️ Security Features

- ✅ Password hashing with bcryptjs (10 salt rounds)
- ✅ JWT token authentication (24-hour expiration)
- ✅ Session management with secure cookies
- ✅ Email validation
- ✅ Input validation on both client and server
- ✅ CORS protection
- ✅ Login history tracking for security audits
- ✅ HttpOnly cookies for session

---

## 🔧 Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:**
- Make sure MongoDB is running
- Check your connection URI in `.env`
- For MongoDB Atlas, ensure IP is whitelisted

### Can't connect from frontend
```
Error: CORS error or fetch failed
```
**Solution:**
- Ensure backend is running on `http://localhost:3000`
- Check CORS is enabled in `server.js`
- Make sure frontend uses correct API_BASE_URL

### Port already in use
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Solution:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

---

## 📝 Usage Example

### Register
1. User fills register form with: full name, email, company, password
2. Frontend sends POST request to `/api/auth/register`
3. Backend validates and creates user in MongoDB
4. Token stored in localStorage
5. User redirected to home page

### Login
1. User enters email and password
2. Frontend sends POST request to `/api/auth/login`
3. Backend verifies credentials and updates last login
4. Token and session created
5. User redirected to home page
6. "Remember me" extends session to 30 days

### Accessing Protected Routes
```javascript
// Get token from localStorage
const token = localStorage.getItem('authToken');

// Use in API calls
fetch('/api/users/profile', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## 🚀 Next Steps (Optional Enhancements)

1. **Email Verification**
   - Send verification email on registration
   - Verify email before allowing login

2. **Password Reset**
   - Forgot password functionality
   - Email reset link

3. **Two-Factor Authentication**
   - Add 2FA for enhanced security

4. **Events Management**
   - Create database models for events
   - Add CRUD operations for events
   - Link events to users

5. **Admin Dashboard**
   - User management
   - Event monitoring
   - Analytics

6. **Frontend Dashboard**
   - Display user profile
   - Show upcoming events
   - Event management interface

---

## 📞 Support

For issues or questions:
1. Check error messages in terminal
2. Review logs in development console
3. Verify MongoDB connection
4. Ensure all dependencies are installed

---

**Happy coding! 🎉**
