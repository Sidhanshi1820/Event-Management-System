# 🚀 START HERE - Event Management Backend

## Welcome! You Have a Complete Backend System Ready to Use 🎉

Your event management system now has a **production-ready backend** with user authentication, MongoDB integration, and a fully connected frontend.

---

## ⚡ Quick Start (Choose Your Path)

### 🪟 Windows Users
```bash
Double-click: start-backend.bat
```

### 🍎 Mac Users
```bash
chmod +x start-backend.sh
./start-backend.sh
```

### 🐧 Linux Users
```bash
chmod +x start-backend.sh
./start-backend.sh
```

### Everyone Can Use
```bash
cd backend
npm install
npm run dev
```

---

## ✅ What You'll See When It Works

```
✓ MongoDB connected successfully
🚀 Server running on http://localhost:3000
📊 MongoDB: mongodb://localhost:27017/event_management
```

---

## 🧪 Test It Immediately

### Step 1: Open Browser
Go to: **register.html**

### Step 2: Fill the Form
```
Full Name: John Doe
Email: john@example.com
Company: Tech Corp
Password: Password123!
Confirm: Password123!
✓ I agree to terms
```

### Step 3: Click Register
You should see: ✅ "Registration successful!"

### Step 4: View Dashboard
Go to: **dashboard.html**
You'll see your profile with edit options!

---

## 📚 Documentation Files (Read in Order)

| File | What You'll Learn | Time |
|------|------------------|------|
| **START_HERE.md** | This file! | 2 min |
| **QUICK_START.md** | 5-minute overview | 5 min |
| **README.md** | Complete overview | 10 min |
| **BACKEND_SETUP.md** | API reference | 15 min |
| **INSTALLATION.md** | Detailed setup | 20 min |
| **CHECKLIST.md** | Complete list | 5 min |

---

## 🗄️ Database Setup (3 Options)

### Option 1: Docker (Easiest!) ✨
```bash
docker-compose up -d
```
✅ MongoDB runs in background

### Option 2: Homebrew (Mac)
```bash
brew install mongodb-community
brew services start mongodb-community
```
✅ MongoDB auto-starts

### Option 3: Download (All Platforms)
Visit: https://www.mongodb.com/try/download/community
✅ Run installer, MongoDB auto-starts

---

## 🎯 What's Working

| Feature | Test It |
|---------|---------|
| **Register** | Go to register.html |
| **Login** | Go to login.html |
| **Profile** | After login → dashboard.html |
| **Edit Profile** | Click "Edit Profile" on dashboard |
| **Change Password** | Dashboard → Change Password section |
| **Login History** | Dashboard → Recent Activity |
| **Remember Me** | Check "Remember me" on login |

---

## 🔥 API Endpoints (If Testing Manually)

```bash
# Register
POST http://localhost:3000/api/auth/register
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "company": "Tech Corp",
  "password": "Password123!",
  "confirm_password": "Password123!"
}

# Login
POST http://localhost:3000/api/auth/login
{
  "email": "john@example.com",
  "password": "Password123!",
  "remember": true
}

# Get Profile (Need token)
GET http://localhost:3000/api/users/profile
Header: Authorization: Bearer <token>
```

---

## 🆘 If Something Doesn't Work

### Server won't start?
```bash
cd backend
npm install  # Reinstall
npm run dev  # Try again
```

### MongoDB connection error?
```bash
# Option 1: Start Docker
docker-compose up -d

# Option 2: Download MongoDB
# Visit: mongodb.com/try/download/community

# Option 3: Use MongoDB Atlas (Cloud)
# Sign up at mongodb.com/cloud/atlas
# Update backend/.env with your URL
```

### Port 3000 already in use?
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <number> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

### Seeing CORS error?
- ✅ Backend must be running on http://localhost:3000
- ✅ Check API_BASE_URL in auth.js is correct
- ✅ Refresh browser page

---

## 📂 File Structure (Key Files)

```
📁 Event management system/
  📁 backend/              ← Server code
    server.js             ← Start here
    package.json          ← Dependencies
    .env                  ← Settings
  
  auth.js                 ← Frontend API calls
  login.html              ← Login page (works!)
  register.html           ← Register page (works!)
  dashboard.html          ← Profile page (new!)
  
  📄 Documentation files
    README.md
    QUICK_START.md
    BACKEND_SETUP.md
    etc.
```

---

## 🔐 How It Works (Simple Flow)

```
1. User fills register form
   ↓
2. Form sends data to backend API
   ↓
3. Backend validates & hashes password
   ↓
4. Data saved to MongoDB
   ↓
5. Token created & sent back
   ↓
6. Frontend stores token
   ↓
7. User can access dashboard
```

---

## 💾 What Gets Saved

### MongoDB (Permanent)
- User name, email, company
- **Hashed password** (never plain text!)
- Last login date
- Login history (IP, time, device)

### Browser localStorage (Until Logout)
- JWT token (for API calls)
- User profile info

### Browser Cookies (Session)
- Session ID (24 hours default)
- Or 30 days if "Remember me" checked

---

## 🎮 Try These Commands

```bash
# Start development server
npm run dev

# Check if setup is correct
node verify-setup.js

# Connect to MongoDB
mongosh

# Stop server
Ctrl+C
```

---

## 📋 Features Available

✅ User Registration (email, password)
✅ User Login (with "Remember me")
✅ Password Hashing (bcryptjs)
✅ JWT Tokens (24-hour duration)
✅ Session Management (secure cookies)
✅ Profile View & Edit
✅ Change Password
✅ Delete Account
✅ Login History Tracking
✅ Complete API Documentation

---

## 🎯 Next Steps

### Right Now (Get It Running)
1. Run startup script or `npm run dev`
2. Test with register.html
3. Test with login.html
4. View dashboard.html

### Soon (Try Features)
1. [ ] Edit your profile
2. [ ] Change your password
3. [ ] View login history
4. [ ] Test "Remember me"

### Later (Build More)
1. Add email verification
2. Add password reset
3. Create event management features
4. Add event registration

---

## 🔧 Customization

### Change Port (for Port 3000)
Edit `backend/.env`:
```env
PORT=8000
```

### Change Database Name
Edit `backend/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/my_app_name
```

### Change Session Time
Edit `backend/server.js`:
```javascript
maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days instead of 1
```

---

## 🆘 Support

**Problems?**
1. Check terminal output
2. Open F12 (browser console) for errors
3. Verify MongoDB is running
4. Read INSTALLATION.md for detailed help

**Want to Learn More?**
- README.md - Project overview
- BACKEND_SETUP.md - API documentation
- QUICK_START.md - 5-minute guide
- INSTALLATION.md - Detailed setup

---

## ⭐ Key Points

✨ **It's ready to use** - Just `npm run dev`
✨ **Fully documented** - 6 guide files included
✨ **Production ready** - Security best practices
✨ **Easy to extend** - Add features on top
✨ **Frontend integrated** - Forms already work
✨ **Database included** - MongoDB all set up

---

## 🎉 You're Ready!

Everything is installed and configured. Just:

```bash
npm run dev
```

Then open **register.html** and start testing!

**Questions?** Check the documentation files - they have everything you need!

---

## 📸 What Users Will Experience

```
1. They visit register.html
2. Fill in their details
3. Click "Register"
4. Account created ✓
5. They're logged in automatically
6. Redirected to home
7. They can visit dashboard.html to see their profile

Next time they visit login.html:
8. Enter email & password
9. Click "Remember me" (optional)
10. They're logged in
11. Can access dashboard
12. Session stays valid for 24h (or 30d)
```

---

## 🚀 Get Started Now!

**Windows:** Double-click `start-backend.bat`
**Mac/Linux:** Run `./start-backend.sh`
**Manual:** `cd backend && npm run dev`

Then visit: **register.html**

**Happy building! 🎊**
