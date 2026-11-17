// API tests that run without a database: the User model is mocked and the
// MongoDB connection is reported as "connected".
const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

// Capture what register tries to save
const savedUsers = [];
jest.mock('../models/User', () => {
  function MockUser(data) {
    Object.assign(this, data, { _id: 'user-1' });
  }
  MockUser.prototype.save = function () {
    savedUsers.push({ ...this });
    return Promise.resolve(this);
  };
  MockUser.prototype.getPublicProfile = function () {
    const { password, ...rest } = this;
    return rest;
  };
  MockUser.findOne = jest.fn().mockResolvedValue(null);
  MockUser.findById = jest.fn(() => ({ select: () => Promise.resolve(null) }));
  return MockUser;
});

const app = require('../server');

// Pretend MongoDB is connected (set after models load; readyState reads this field)
mongoose.connection._readyState = 1;

beforeEach(() => {
  savedUsers.length = 0;
  delete process.env.DEMO_MODE;
});

describe('Public registration', () => {
  test('cannot create an admin account', async () => {
    const res = await request(app).post('/api/auth/register').send({
      username: 'hacker', email: 'hacker@example.com', password: 'secret123', role: 'admin',
    });
    expect(res.status).toBe(400);
    expect(savedUsers).toHaveLength(0);
  });

  test('cannot create a doctor account', async () => {
    const res = await request(app).post('/api/auth/register').send({
      username: 'fakedoc', email: 'fakedoc@example.com', password: 'secret123', role: 'doctor',
    });
    expect(res.status).toBe(400);
    expect(savedUsers).toHaveLength(0);
  });

  test('always creates a patient', async () => {
    const res = await request(app).post('/api/auth/register').send({
      username: 'newpatient', email: 'new@example.com', password: 'secret123',
    });
    expect(res.status).toBe(201);
    expect(savedUsers).toHaveLength(1);
    expect(savedUsers[0].role).toBe('patient');
  });
});

describe('Tokens', () => {
  test('a refresh token is rejected as an access token', async () => {
    const refreshToken = jwt.sign({ id: 'user-1', type: 'refresh' }, process.env.JWT_SECRET);
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${refreshToken}`);
    expect(res.status).toBe(401);
  });
});

describe('Demo mode', () => {
  test('blocks deletes when DEMO_MODE=true', async () => {
    process.env.DEMO_MODE = 'true';
    const res = await request(app).delete('/api/patients/123');
    expect(res.status).toBe(403);
    expect(res.body.demo).toBe(true);
  });

  test('blocks user management and password changes', async () => {
    process.env.DEMO_MODE = 'true';
    expect((await request(app).post('/api/users').send({})).status).toBe(403);
    expect((await request(app).put('/api/users/123/deactivate')).status).toBe(403);
    expect((await request(app).put('/api/auth/change-password').send({})).status).toBe(403);
  });

  test('still allows reading data (request reaches auth check)', async () => {
    process.env.DEMO_MODE = 'true';
    const res = await request(app).get('/api/patients');
    expect(res.status).toBe(401); // no token, but not blocked by the demo guard
  });

  test('does nothing when DEMO_MODE is off', async () => {
    const res = await request(app).delete('/api/patients/123');
    expect(res.status).toBe(401); // normal auth check, not the demo guard
  });
});

describe('Health check', () => {
  test('responds so the frontend can wake the server', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
