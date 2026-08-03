import { ApiError } from '../../src/utils/ApiError.js';

describe('ApiError factories', () => {
  it('builds correct status codes for each factory', () => {
    expect(ApiError.badRequest('bad').statusCode).toBe(400);
    expect(ApiError.unauthorized().statusCode).toBe(401);
    expect(ApiError.forbidden().statusCode).toBe(403);
    expect(ApiError.notFound().statusCode).toBe(404);
    expect(ApiError.conflict().statusCode).toBe(409);
  });
});
