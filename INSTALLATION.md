# Event Management System - Installation & Setup Guide

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Running the Project](#running-the-project)
5. [API Testing](#api-testing)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Node.js** v14+ ([Download](https://nodejs.org/))
- **npm** v6+ (comes with Node.js)
- **MongoDB** (Local or Cloud)

### Optional
- **Docker** & **Docker Compose** (for containerized MongoDB)
- **Postman** (for API testing)
- **Git** (for version control)

---

## Installation

### 1. Clone/Navigate to Project
```bash
cd "Event management system"
```

### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

This installs:
- `express` - Web framework
- `mongoose` - MongoDB ORM
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT authentication
- `express-session` - Session management
- `dotenv` - Environment variables
- `cors` - Cross-origin requests
- `nodemon` - Auto-reload in development

---

## Configuration

### Option A: Local MongoDB

**Windows:**
1. Download MongoDB Community Edition from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Run the installer
3. MongoDB runs as a Windows Service on `mongodb://localhost:27017`

**Mac (Using Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install -y mongodb
sudo systemctl start mongodb
```

---

### Option B: MongoDB Atlas (Cloud)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new project
4. Create a cluster (M0 Free is enough)
5. Create a database user
6. Get your connection string
7. Update `.env` file:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/event_management?retryWrites=true&w=majority
```

---

### Option C: Docker (MongoDB in Container)

**Prerequisites:** Install Docker & Docker Compose

```bash
# Start MongoDB in background
docker-compose up -d

# MongoDB will be at: mongodb://localhost:27017
# Mongo Express (UI) at: http://localhost:8081
```

To stop:
```bash
docker-compose down
```

---

### Configure Environment Variables

1. Open `backend/.env`
2. Update with your settings:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/event_management

# Security Keys (REQUIRED - generate strong random values, see below)
JWT_SECRET=<paste generated secret here>
SESSION_SECRET=<paste a different generated secret here>

# Server
NODE_ENV=development
PORT=3000
```

Generate strong random secrets with Node.js — run this once per variable:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> ⚠️ **IMPORTANT**: Never hand-write these secrets. The server **refuses to start** if
> JWT_SECRET or SESSION_SECRET is missing or empty. Values that still contain
> placeholder markers such as `your_...`, `change_this` or `generate_random_string`
> abort startup in production and print a warning in development.

See `backend/.env.example` for the full list of supported environment variables.

---

## Running the Project

### Start Backend Server

**Development Mode (with auto-reload):**
```bash
cd backend
npm run dev
```

**Production Mode:**
```bash
cd backend
npm start
```

You should see:
```
✓ MongoDB connected successfully
🚀 Server running on http://localhost:3000
```

### Access Frontend

1. Open `login.html` in browser (or use Live Server)
2. Or use the built-in Dashboard at `dashboard.html`

---

## API Testing

### Using Browser Console

**Register:**
```javascript
fetch('http://localhost:3000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    full_name: 'John Doe',
    email: 'john@example.com',
    company: 'Tech Corp',
    password: 'Secure123!',
    confirm_password: 'Secure123!'
  })
}).then(r => r.json()).then(console.log)
```

**Login:**
```javascript
fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'Secure123!',
    remember: true
  })
}).then(r => r.json()).then(console.log)
```

### Using Postman

1. Import `backend/postman_collection.json` (create if needed)
2. Or manually create requests:
   - Method: `POST`
   - URL: `http://localhost:3000/api/auth/login`
   - Headers: `Content-Type: application/json`
   - Body (JSON):
   ```json
   {
     "email": "john@example.com",
     "password": "Secure123!",
     "remember": true
   }
   ```

---

## Troubleshooting

### MongoDB Connection Errors

**Error: `connect ECONNREFUSED 127.0.0.1:27017`**

Solutions:
- Make sure MongoDB is running
- Check connection URI in `.env`
- For Docker: run `docker-compose up -d`
- For local: ensure MongoDB service is started

**Error: `MongoNetworkError`**

Solutions:
- Check firewall settings
- For MongoDB Atlas: Whitelist your IP
- Verify connection string includes credentials

---

### Backend Won't Start

**Error: `Cannot find module 'express'`**

Solution:
```bash
cd backend
npm install
```

**Error: `Port 3000 already in use`**

Solution (Windows):
```bash
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

Solution (Mac/Linux):
```bash
lsof -ti:3000 | xargs kill -9
```

Or change PORT in `.env`:
```env
PORT=3001
```

---

### Frontend Form Issues

**Error: `CORS error` or `Failed to fetch`**

Solutions:
- Check backend is running on `http://localhost:3000`
- Check `API_BASE_URL` in `auth.js`
- Verify CORS is enabled in `server.js`

**Error: `Token not found` after login**

Solutions:
- Check browser localStorage (F12 → Application → LocalStorage)
- Verify token is being saved by auth.js
- Check browser console for JavaScript errors

---

### Database Issues

**Error: `Database already exists`**

Solution: MongoDB will handle this automatically

**Need to reset data:**
```bash
# MongoDB CLI
use event_management
db.users.deleteMany({})
```

---

## File Structure After Installation

```
Event management system/
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── .env
│   ├── .gitignore
│   ├── models/
│   │   └── User.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── users.js
│   └── middleware/
│       └── auth.js
├── auth.js
├── dashboard.html
├── login.html
├── register.html
├── home.html
├── docker-compose.yml
├── BACKEND_SETUP.md
├── QUICK_START.md
└── INSTALLATION.md (this file)
```

---

## Security Tips

1. **Change Default Secrets:**
   - Generate new JWT_SECRET
   - Generate new SESSION_SECRET

2. **Use HTTPS in Production:**
   - Get SSL certificate
   - Use `https://` for all connections

3. **Database Security:**
   - Use strong MongoDB password
   - Enable IP whitelist
   - Enable authentication

4. **Environment Variables:**
   - Never commit `.env` to git
   - Use `.gitignore`
   - Keep secrets safe

5. **Password Requirements:**
   - Minimum 8 characters
   - Use bcryptjs for hashing
   - Never store plain text

---

## Next Steps

1. ✅ Install backend dependencies
2. ✅ Setup MongoDB
3. ✅ Configure `.env`
4. ✅ Start server (`npm run dev`)
5. 📋 Test registration/login
6. 📋 Add event management features
7. 📋 Deploy to production

---

## Common Commands

```bash
# Backend
cd backend
npm install              # Install dependencies
npm run dev             # Development mode
npm start               # Production mode
npm run lint            # Check code (if configured)

# MongoDB (Docker)
docker-compose up -d    # Start MongoDB
docker-compose down     # Stop MongoDB
docker-compose logs     # View logs

# MongoDB (CLI)
mongosh                 # Connect to MongoDB
use event_management    # Select database
db.users.find()        # View all users
```

---

## Performance Tips

1. **Development**: Use `npm run dev` with nodemon
2. **Production**: Use `npm start` with process manager like PM2
3. **Database**: Add indexes on frequently queried fields
4. **Caching**: Add Redis for session caching (optional)
5. **Frontend**: Minimize auth.js bundle size

---

## Support & Resources

- [Express.js Docs](https://expressjs.com/)
- [Mongoose Docs](https://mongoosejs.com/)
- [MongoDB Docs](https://docs.mongodb.com/)
- [JWT Authentication](https://jwt.io/)
- [CORS Explained](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

---

**Setup complete! Happy coding! 🚀**
