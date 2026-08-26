import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server';
import { User } from '../models/User';

describe('Auth Endpoints', () => {
  const testEmail = `test_${Math.random().toString(36).substring(2, 8)}@example.com`;
  const testPassword = 'testpassword123';
  let token = '';

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect('mongodb://127.0.0.1:27017/recoverai');
    }
  });

  afterAll(async () => {
    await User.deleteMany({ email: testEmail });
  });

  it('should register a new merchant and admin user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: testEmail,
        password: testPassword,
        firstName: 'Test',
        lastName: 'Admin',
        companyName: 'Test Company LLC'
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('email', testEmail);
    token = res.body.token;
  });

  it('should login the registered user and return a token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testEmail,
        password: testPassword
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('should fetch the profile of the logged in user', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toHaveProperty('email', testEmail);
    expect(res.body.merchant).toHaveProperty('name', 'Test Company LLC');
  });
});
