import request from 'supertest';
import { createApp } from '../../src/app.js';
import { connectTestDb, dropAndDisconnectTestDb } from '../helpers/testDb.js';

let app;

beforeAll(async () => {
  await connectTestDb('auth');
  app = createApp();
});

afterAll(async () => {
  await dropAndDisconnectTestDb();
});

describe('auth', () => {
  const creds = { email: 'jane@example.com', password: 'SuperSecret1', name: 'Jane' };

  it('registers, rejects duplicates, logs in, and rejects bad passwords', async () => {
    const registerRes = await request(app).post('/api/auth/register').send(creds);
    expect(registerRes.status).toBe(201);
    expect(registerRes.body.accessToken).toBeTruthy();

    const dup = await request(app).post('/api/auth/register').send(creds);
    expect(dup.status).toBe(409);

    const login = await request(app).post('/api/auth/login').send(creds);
    expect(login.status).toBe(200);

    const badLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: creds.email, password: 'wrong' });
    expect(badLogin.status).toBe(401);
  });

  it('rejects /me without a token and accepts one with a valid token', async () => {
    const noAuth = await request(app).get('/api/auth/me');
    expect(noAuth.status).toBe(401);

    const login = await request(app).post('/api/auth/login').send(creds);
    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${login.body.accessToken}`);
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe(creds.email);
  });
});
