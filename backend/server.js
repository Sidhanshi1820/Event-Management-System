const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const dotenv = require('dotenv');
const path = require('path');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Always load the backend/.env, never a .env found relative to the process CWD
// (running `node backend/server.js` from the repo root would otherwise pick up the
// Docker-only root .env and leave JWT_SECRET undefined).
dotenv.config({ path: path.join(__dirname, '.env') });

const isProd = process.env.NODE_ENV === 'production';

// Startup secret validation - refuse to boot with missing/weak secrets
const SECRET_NAMES = ['JWT_SECRET'];
// Substring markers matched case-insensitively. 'super_secret' and 'changeme'
// are the values INSTALLATION.md tells users to set, and 'your_*' still covers
// the older doc defaults.
const WEAK_SECRETS = [
  'change_this',
  'your_jwt_secret',
  'super_secret',
  'generate_random_string',
  'changeme'
];
// Prefix markers: any value beginning with "your" (e.g. the documented
// JWT_SECRET=your_super_secret_jwt_key_12345) is a placeholder, not a secret.
const WEAK_SECRET_PREFIXES = ['your'];

// A missing or empty secret is ALWAYS fatal in every environment: booting with it
// makes every login/register throw "secretOrPrivateKey must have a value" (500).
const missingSecrets = SECRET_NAMES.filter((name) => !(process.env[name] || '').trim());

if (missingSecrets.length > 0) {
  console.error('\n✗ FATAL: required secrets are missing or empty:');
  missingSecrets.forEach((name) => console.error(`   - ${name} is missing or empty`));
  console.error('   Set a strong JWT_SECRET in your environment.\n');
  process.exit(1);
}

// A secret that is present but still holds a placeholder value only blocks production.
const placeholderProblems = SECRET_NAMES
  .map((name) => {
    const value = process.env[name].toLowerCase();
    const weak = WEAK_SECRETS.find((bad) => value.includes(bad));
    if (weak) return `${name} still contains the placeholder "${weak}"`;
    const prefix = WEAK_SECRET_PREFIXES.find((bad) => value.startsWith(bad));
    return prefix ? `${name} still starts with the placeholder "${prefix}"` : null;
  })
  .filter(Boolean);

if (placeholderProblems.length > 0) {
  if (isProd) {
    console.error('\n✗ FATAL: insecure secrets detected:');
    placeholderProblems.forEach((problem) => console.error(`   - ${problem}`));
    console.error('   Set a strong JWT_SECRET in your environment.\n');
    process.exit(1);
  } else {
    console.warn('\n🟡 WARNING: insecure secrets detected (development mode, continuing):');
    placeholderProblems.forEach((problem) => console.warn(`   - ${problem}`));
    console.warn('   Do NOT use these values in production.\n');
  }
}

const app = express();

// CORS whitelist (comma-separated origins in CORS_ORIGIN)
const DEFAULT_CORS_ORIGINS = [
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'http://localhost:5500',
  'http://localhost:3000'
];
const allowedOrigins = (process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : DEFAULT_CORS_ORIGINS
).map((origin) => origin.trim()).filter(Boolean);

// Middleware
// CSP is disabled because the site loads Tailwind from a CDN and uses inline
// scripts; wiring up nonces/hashes is tracked as follow-up work.
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // curl/Postman send no Origin
    if (origin === 'null') return cb(null, true); // file:// pages (double-clicked HTML) send the literal origin 'null'
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(null, false); // unknown origin -> no CORS headers
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));
// Block NoSQL operator injection (e.g. {"email": {"$ne": null}})
app.use(mongoSanitize());

// Always trust one proxy hop so express-rate-limit v8 does not throw
// ERR_ERL_UNEXPECTED_X_FORWARDED_FOR (500 on every request) when a dev client
// sends X-Forwarded-For; 'loopback' is the safe non-prod value.
app.set('trust proxy', isProd ? 1 : 'loopback');

// Rate limiting
const rateLimitMessage = { success: false, message: 'Too many requests, please try again later.' };
const baseLimiter = {
  standardHeaders: true,
  legacyHeaders: false,
  // Never count CORS preflights, otherwise every cross-origin request costs 2 units.
  skip: (req) => req.method === 'OPTIONS',
  message: rateLimitMessage
};

const apiLimiter = rateLimit({
  ...baseLimiter,
  windowMs: 15 * 60 * 1000,
  limit: 300
});

const authLimiter = rateLimit({
  ...baseLimiter,
  windowMs: 15 * 60 * 1000,
  limit: 10
});

const proposalLimiter = rateLimit({
  ...baseLimiter,
  windowMs: 60 * 60 * 1000,
  limit: 5
});

// MongoDB Connection
const connectDatabase = async () => {
  const localUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/event_management';

  try {
    await mongoose.connect(localUri);
    console.log('✓ MongoDB connected successfully');
  } catch (err) {
    if (isProd) {
      console.error('✗ FATAL: MongoDB connection error:', err.message);
      console.error('   Refusing to start in production without a real database.\n');
      process.exit(1);
    }

    console.error('✗ MongoDB connection error:', err.message);
    console.log('🟡 Falling back to in-memory MongoDB for development...');

    const mongoServer = await MongoMemoryServer.create();
    const memoryUri = mongoServer.getUri();
    await mongoose.connect(memoryUri);
    console.log('✓ Connected to in-memory MongoDB');
  }
};

// Health check route - registered BEFORE the rate limiters so platform health
// pings never consume the global API budget.
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running', timestamp: new Date() });
});

// Routes
app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/proposals', proposalLimiter);
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/proposals', require('./routes/proposals'));
app.use('/api/events', require('./routes/events'));
app.use('/api/newsletter', require('./routes/newsletter'));

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Event Management API' });
});

// Error handling middleware
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: 'Internal Server Error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await connectDatabase();
  app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 MongoDB: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/event_management'}\n`);
  });
};

module.exports = app;

if (require.main === module) {
  startServer();
}