# 🚀 Quick Start Guide - Event Management Backend

## ⚡ 5-Minute Setup

### Step 1: Open Terminal in Backend Folder
```bash
cd backend
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Setup MongoDB
- **Option A (Local)**: Make sure MongoDB is running
- **Option B (Cloud)**: Update `.env` with MongoDB Atlas URL

### Step 4: Start Server
```bash
npm run dev
```

You should see:
```
✓ MongoDB connected successfully
🚀 Server running on http://localhost:3000
```

---

## 🔗 Test the Backend

### Register a User
Use Postman or your browser console:
```javascript
fetch('http://localhost:3000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    full_name: 'John Doe',
    email: 'john@example.com',
    company: 'Tech Corp',
    password: 'Password123!',
    confirm_password: 'Password123!'
  })
}).then(r => r.json()).then(console.log)
```

### Login a User
```javascript
fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'Password123!',
    remember: true
  })
}).then(r => r.json()).then(console.log)
```

---

## 🧪 Test Frontend Forms

1. Open `register.html` → Fill form → Submit
2. Open `login.html` → Login with credentials
3. You'll be redirected to `home.html` after success
4. Visit `dashboard.html` to see your profile

---

## 📋 Key Files Created

### Backend Structure
```
backend/
├── server.js              ← Main server
├── package.json          ← Dependencies
├── .env                  ← Environment setup
├── models/User.js        ← Database schema
├── routes/auth.js        ← Login/Register/Logout
├── routes/users.js       ← Profile management
└── middleware/auth.js    ← Token verification
```

### Frontend Scripts
```
auth.js                   ← Handles all auth communications
dashboard.html            ← User profile page
```

---

## 🔑 What's Stored

### Database (MongoDB)
```javascript
User: {
  fullName: "John Doe",
  email: "john@example.com",
  company: "Tech Corp",
  password: "bcrypt_hashed_password",
  lastLogin: "2024-01-15T10:30:00Z",
  loginHistory: [
    { timestamp, ipAddress, userAgent },
    ...
  ]
}
```

### Browser (localStorage)
```javascript
authToken: "jwt_token_for_api_calls"
userData: { id, fullName, email, company }
```

### Browser (Session cookie)
- 24 hours by default
- 30 days if "Remember me" is checked
- Automatically cleared on logout

---

## ✅ Features Available

| Feature | Status | Details |
|---------|--------|---------|
| User Registration | ✅ | Email validation, password hashing |
| User Login | ✅ | Remember me, last login tracking |
| Session Management | ✅ | HTTP-only cookies, JWT tokens |
| Profile View/Edit | ✅ | Update name & company |
| Change Password | ✅ | Secure password update |
| Login History | ✅ | Track all logins with IP & device |
| Delete Account | ✅ | Complete account removal |

---

## 🐛 Troubleshooting

### Backend won't start
```
Error: Cannot find module 'express'
→ Run: npm install
```

### MongoDB connection error
```
Error: connect ECONNREFUSED
→ Make sure MongoDB is running
→ Check connection URI in .env
```

### CORS Error from Frontend
```
Error: Cross-Origin Request Blocked
→ Check API_BASE_URL in auth.js is 'http://localhost:3000/api'
→ Ensure backend is running
```

### Form not submitting
```
→ Check browser console for errors (F12)
→ Verify backend is responding to requests
→ Check that auth.js is loaded
```

---

## 📚 API Summary

### Authentication
- `POST /api/auth/register` → Create account
- `POST /api/auth/login` → Login user
- `POST /api/auth/logout` → Logout
- `GET /api/auth/status` → Check if logged in
- `GET /api/auth/login-history` → View login history

### User Profile
- `GET /api/users/profile` → Get user info
- `PUT /api/users/profile` → Update profile
- `POST /api/users/change-password` → Change password
- `DELETE /api/users/account` → Delete account

---

## 🎯 Next Steps

1. ✅ Backend is set up
2. ✅ Frontend forms connected
3. ✅ User authentication working
4. 📋 Add event management features
5. 📋 Build event creation/editing pages
6. 📋 Add admin dashboard

---

## 💾 Important Notes

- **Passwords** are hashed with bcryptjs (never stored in plain text)
- **Tokens** expire after 24 hours
- **Sessions** auto-clear on logout or browser close
- **Login history** stores last 10 logins per user
- **Remember me** extends session to 30 days

---

## 📞 Need Help?

1. Check [BACKEND_SETUP.md](BACKEND_SETUP.md) for detailed docs
2. Look at error messages in terminal
3. Check browser console (F12) for JavaScript errors
4. Verify MongoDB is running
5. Make sure all npm packages are installed

---

**Everything is ready! Start building! 🎉**
