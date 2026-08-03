import request from 'supertest';
import { createApp } from '../../src/app.js';
import { connectTestDb, dropAndDisconnectTestDb } from '../helpers/testDb.js';
import { Book } from '../../src/models/Book.js';

let app;
let tokenA;
let tokenB;
let book1;
let book2;

beforeAll(async () => {
  await connectTestDb('books');
  app = createApp();

  [book1, book2] = await Book.insertMany([
    {
      openLibraryKey: '/works/OL1W',
      title: 'The Great Test',
      authorNames: ['Ada Lovelace'],
      subjects: ['Fiction', 'Testing'],
      firstPublishYear: 2000,
    },
    {
      openLibraryKey: '/works/OL2W',
      title: 'Another Fixture',
      authorNames: ['Grace Hopper'],
      subjects: ['Fiction'],
      firstPublishYear: 2001,
    },
  ]);

  const regA = await request(app)
    .post('/api/auth/register')
    .send({ email: 'a@example.com', password: 'SuperSecret1', name: 'A' });
  tokenA = regA.body.accessToken;

  const regB = await request(app)
    .post('/api/auth/register')
    .send({ email: 'b@example.com', password: 'SuperSecret1', name: 'B' });
  tokenB = regB.body.accessToken;
});

afterAll(async () => {
  await dropAndDisconnectTestDb();
});

function auth(req, token) {
  return req.set('Authorization', `Bearer ${token}`);
}

describe('book search', () => {
  it('full-text searches by title', async () => {
    const res = await auth(request(app).get('/api/books?q=Great'), tokenA);
    expect(res.status).toBe(200);
    expect(res.body.books.some((b) => b.title === 'The Great Test')).toBe(true);
  });

  it('filters by subject facet', async () => {
    const res = await auth(request(app).get('/api/books?subject=Testing'), tokenA);
    expect(res.status).toBe(200);
    expect(res.body.books).toHaveLength(1);
    expect(res.body.books[0].title).toBe('The Great Test');
  });

  it('paginates with a cursor', async () => {
    const page1 = await auth(request(app).get('/api/books?limit=1'), tokenA);
    expect(page1.body.books).toHaveLength(1);
    expect(page1.body.nextCursor).toBeTruthy();

    const page2 = await auth(request(app).get(`/api/books?limit=1&cursor=${page1.body.nextCursor}`), tokenA);
    expect(page2.body.books).toHaveLength(1);
    expect(page2.body.books[0]._id).not.toBe(page1.body.books[0]._id);
  });
});

describe('shelf', () => {
  it('adds a book to a shelf and lists it grouped by status', async () => {
    const add = await auth(request(app).post('/api/shelf'), tokenA).send({ bookId: book1._id, status: 'reading' });
    expect(add.status).toBe(201);

    const shelves = await auth(request(app).get('/api/shelf'), tokenA);
    expect(shelves.body.reading).toHaveLength(1);
  });

  it('moving a book to a new status upserts rather than duplicating', async () => {
    await auth(request(app).post('/api/shelf'), tokenA).send({ bookId: book1._id, status: 'read' });
    const shelves = await auth(request(app).get('/api/shelf'), tokenA);
    expect(shelves.body.read).toHaveLength(1);
    expect(shelves.body.reading).toHaveLength(0);
  });
});

describe('reviews and ownership', () => {
  it('creates a review and rejects deleting someone else’s review', async () => {
    const created = await auth(request(app).post('/api/reviews'), tokenA).send({
      bookId: book2._id,
      rating: 5,
      text: 'Loved it',
    });
    expect(created.status).toBe(201);
    const reviewId = created.body.review._id;

    const deleteAsB = await auth(request(app).delete(`/api/reviews/${reviewId}`), tokenB);
    expect(deleteAsB.status).toBe(404); // scoped query never finds it for another user

    const deleteAsA = await auth(request(app).delete(`/api/reviews/${reviewId}`), tokenA);
    expect(deleteAsA.status).toBe(204);
  });
});
