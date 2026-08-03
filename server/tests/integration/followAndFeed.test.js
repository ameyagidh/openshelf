import request from 'supertest';
import { createApp } from '../../src/app.js';
import { connectTestDb, dropAndDisconnectTestDb } from '../helpers/testDb.js';

let app;
let tokenA;
let idA;
let tokenB;
let idB;

beforeAll(async () => {
  await connectTestDb('follow');
  app = createApp();

  const regA = await request(app)
    .post('/api/auth/register')
    .send({ email: 'alice@example.com', password: 'SuperSecret1', name: 'Alice' });
  tokenA = regA.body.accessToken;
  idA = regA.body.user.id;

  const regB = await request(app)
    .post('/api/auth/register')
    .send({ email: 'bob@example.com', password: 'SuperSecret1', name: 'Bob' });
  tokenB = regB.body.accessToken;
  idB = regB.body.user.id;
});

afterAll(async () => {
  await dropAndDisconnectTestDb();
});

function auth(req, token) {
  return req.set('Authorization', `Bearer ${token}`);
}

describe('follow graph', () => {
  it('rejects following yourself', async () => {
    const res = await auth(request(app).post(`/api/users/${idA}/follow`), tokenA);
    expect(res.status).toBe(400);
  });

  it('follows a user, rejects a duplicate follow, then unfollows', async () => {
    const follow = await auth(request(app).post(`/api/users/${idB}/follow`), tokenA);
    expect(follow.status).toBe(201);

    const dup = await auth(request(app).post(`/api/users/${idB}/follow`), tokenA);
    expect(dup.status).toBe(409);

    const followers = await auth(request(app).get(`/api/users/${idB}/followers`), tokenB);
    expect(followers.body.followers).toHaveLength(1);

    const unfollow = await auth(request(app).delete(`/api/users/${idB}/follow`), tokenA);
    expect(unfollow.status).toBe(204);

    const followersAfter = await auth(request(app).get(`/api/users/${idB}/followers`), tokenB);
    expect(followersAfter.body.followers).toHaveLength(0);
  });
});

describe('activity feed', () => {
  it('a follow action shows up in the global feed', async () => {
    await auth(request(app).post(`/api/users/${idB}/follow`), tokenA);
    const feed = await auth(request(app).get('/api/activity/feed'), tokenA);
    expect(feed.status).toBe(200);
    expect(feed.body.activities.some((a) => a.type === 'followed')).toBe(true);
  });

  it('the following-scoped feed only includes the follower and followees', async () => {
    const feed = await auth(request(app).get('/api/activity/feed?scope=following'), tokenA);
    expect(feed.status).toBe(200);
    for (const activity of feed.body.activities) {
      expect([idA, idB]).toContain(activity.actor._id.toString());
    }
  });
});
