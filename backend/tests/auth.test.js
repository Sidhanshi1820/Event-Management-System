// End-to-end API tests for the EventNov@ backend.
//
// The suite boots a throwaway in-memory MongoDB (mongodb-memory-server), wires
// mongoose to it, then requires the express app from ../server. server.js only
// connects the database and starts listening when `require.main === module`,
// so importing the app here is side-effect free.
//
// Notes on determinism:
// - Every email carries a Date.now() suffix, so reruns never collide with
//   documents left behind by an older run.
// - The rate limiters in server.js are in-memory and keyed per IP, and the
//   login + register limiters share a single 10-requests-per-15-minutes
//   store. supertest always connects from loopback, so every request would
//   otherwise drain the same bucket and the last few calls would get 429.
//   server.js sets `trust proxy: loopback`, so each test sends its own
//   documentation-range X-Forwarded-For address and gets a fresh bucket.
//   The limiters themselves are never asserted on — the lockout test below
//   targets the per-email login lockout, not the per-IP limiter.
// - models/EventType.js (the /api/events catalog model) is expected to exist;
//   two event types are seeded directly through mongoose for the events test.

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../models/User');
const EventType = require('../models/EventType');

let app;
let mongoServer;

// Unique-per-run fixtures
const runStamp = Date.now();

const testUser = {
  full_name: 'Jane Tester',
  email: `jane.tester.${runStamp}@example.com`,
  company: 'EventNov QA',
  password: 'SuperSecretPass1'
};

const passwordAfterChange = 'ChangedPass456';
const passwordAfterReset = 'ResetPass789';

const lockoutEmail = `lockout.case.${runStamp}@example.com`;

let authToken; // token minted by register/login for testUser
let resetToken; // handed out by forgot-password outside production

// ---- per-test IP helper (see the header comment for why this exists) -------
let ipCounter = 0;
const uniqueTestIp = () => `203.0.113.${++ipCounter}`; // 203.0.113.0/24 = TEST-NET-3
const api = (ip) => ({
  get: (url) => request(app).get(url).set('X-Forwarded-For', ip),
  post: (url) => request(app).post(url).set('X-Forwarded-For', ip)
});

beforeAll(async () => {
  // Secrets must exist BEFORE the app module is required: server.js validates
  // them at import time. dotenv (loaded by server.js) never overrides
  // environment variables that are already set, so these values win.
  process.env.JWT_SECRET = 'test-secret-12345';
  process.env.SESSION_SECRET = 'test-session-12345';

  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // Seed a dedicated victim for the login-lockout test straight through
  // mongoose (the pre-save hook hashes the password) so no extra register
  // calls are spent.
  await User.create({
    fullName: 'Lockout Tester',
    email: lockoutEmail,
    company: 'EventNov QA',
    password: 'LockoutPass123',
    isVerified: true
  });

  app = require('../server');
}, 120000); // generous: a cold CI cache may still be fetching the mongod binary

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('POST /api/auth/register', () => {
  test('creates an account and returns a token (201)', async () => {
    const res = await api(uniqueTestIp()).post('/api/auth/register').send({
      ...testUser,
      confirm_password: testUser.password
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.user).toMatchObject({ email: testUser.email });
    authToken = res.body.token;
  });

  test('rejects a duplicate email (400)', async () => {
    const res = await api(uniqueTestIp()).post('/api/auth/register').send({
      ...testUser,
      confirm_password: testUser.password
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('rejects a weak password (400)', async () => {
    const res = await api(uniqueTestIp()).post('/api/auth/register').send({
      full_name: 'Weak Password',
      email: `weak.pw.${runStamp}@example.com`,
      company: 'EventNov QA',
      password: 'short',
      confirm_password: 'short'
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/auth/login', () => {
  test('rejects a wrong password (401)', async () => {
    const res = await api(uniqueTestIp()).post('/api/auth/login').send({
      email: testUser.email,
      password: 'NotTheRightPassword1'
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.token).toBeUndefined();
  });

  test('logs in with the correct password (200)', async () => {
    const res = await api(uniqueTestIp()).post('/api/auth/login').send({
      email: testUser.email,
      password: testUser.password
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.token).toBe('string');
    authToken = res.body.token;
  });
});

describe('GET /api/users/profile', () => {
  test('returns the profile for a valid Bearer token (200)', async () => {
    const res = await api(uniqueTestIp()).get('/api/users/profile')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toMatchObject({ email: testUser.email });
  });

  test('rejects a request without a token (401)', async () => {
    const res = await api(uniqueTestIp()).get('/api/users/profile');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/users/change-password', () => {
  test('changes the password and revokes the old token (200, then 401)', async () => {
    const ip = uniqueTestIp();

    const changed = await api(ip).post('/api/users/change-password')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        currentPassword: testUser.password,
        newPassword: passwordAfterChange,
        confirmPassword: passwordAfterChange
      });

    expect(changed.status).toBe(200);
    expect(changed.body.success).toBe(true);
    testUser.password = passwordAfterChange;

    // Changing the password bumps User.tokenVersion, so every JWT minted
    // before the change must stop working immediately.
    const stale = await api(ip).get('/api/users/profile')
      .set('Authorization', `Bearer ${authToken}`);

    expect(stale.status).toBe(401);
  });
});

describe('forgot/reset password flow', () => {
  // Jest runs with NODE_ENV=test, so the response must carry the dev-only
  // resetToken. In production the token is deliberately omitted and the flow
  // below is not testable end to end.
  test('POST /api/auth/forgot-password answers 200 and exposes resetToken outside production', async () => {
    const res = await api(uniqueTestIp()).post('/api/auth/forgot-password').send({
      email: testUser.email
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    if (process.env.NODE_ENV !== 'production') {
      expect(typeof res.body.resetToken).toBe('string');
      resetToken = res.body.resetToken;
    }
  });

  test('POST /api/auth/reset-password accepts the token (200)', async () => {
    const res = await api(uniqueTestIp()).post('/api/auth/reset-password').send({
      token: resetToken,
      password: passwordAfterReset
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    testUser.password = passwordAfterReset;
  });

  test('logs in with the new password (200)', async () => {
    const res = await api(uniqueTestIp()).post('/api/auth/login').send({
      email: testUser.email,
      password: passwordAfterReset
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.token).toBe('string');
  });
});

describe('POST /api/proposals', () => {
  test('accepts a booking proposal (201)', async () => {
    const res = await api(uniqueTestIp()).post('/api/proposals').send({
      full_name: 'Proposal Tester',
      email: `proposal.${runStamp}@example.com`,
      company: 'Proposal Co',
      event_type: 'Corporate Event',
      guests: 120,
      message: 'Please get in touch.'
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });
});

describe('GET /api/events', () => {
  test('lists the active event types sorted by sortOrder (200)', async () => {
    await EventType.create([
      {
        title: 'Music Festival',
        slug: 'music-festival',
        category: 'Music',
        description: 'Open-air stages across an entire weekend.',
        sortOrder: 1
      },
      {
        title: 'Corporate Gala',
        slug: 'corporate-gala',
        category: 'Corporate',
        description: 'A black-tie evening of awards and networking.',
        sortOrder: 2
      }
    ]);

    const res = await api(uniqueTestIp()).get('/api/events');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.events)).toBe(true);

    const slugs = res.body.events.map((event) => event.slug);
    expect(slugs).toContain('music-festival');
    expect(slugs).toContain('corporate-gala');

    // Sorted ascending by sortOrder: the sortOrder-1 event comes first.
    expect(slugs.indexOf('music-festival')).toBeLessThan(slugs.indexOf('corporate-gala'));
    expect(res.body.events[slugs.indexOf('music-festival')]).toMatchObject({
      title: 'Music Festival',
      category: 'Music'
    });
  });
});

describe('login lockout', () => {
  test('locks the account after 5 failed logins (423)', async () => {
    // One IP for the whole burst: the lockout is keyed by the lowercased
    // email, not by IP, and 6 requests stay inside the per-IP limiter budget.
    const ip = uniqueTestIp();

    let res;
    for (let attempt = 0; attempt < 6; attempt += 1) {
      res = await api(ip).post('/api/auth/login').send({
        email: lockoutEmail,
        password: 'WrongPassword1'
      });

      if (attempt === 0) {
        // Before the lock kicks in, a wrong password is an ordinary 401.
        expect(res.status).toBe(401);
      }
    }

    // Six probes: implementations may answer 423 on the 5th failed attempt
    // itself, or on the first attempt after 5 failures — asserting only the
    // final probe keeps the test correct for both.
    expect(res.status).toBe(423);
    expect(res.body.success).toBe(false);
  });
});
