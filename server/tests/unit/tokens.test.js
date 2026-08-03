import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from '../../src/utils/tokens.js';

const fakeUser = { _id: { toString: () => 'user123' }, role: 'user', refreshTokenVersion: 2 };

describe('token utils', () => {
  it('signs and verifies an access token round-trip', () => {
    const token = signAccessToken(fakeUser);
    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe('user123');
    expect(payload.role).toBe('user');
  });

  it('carries the refresh token version for revocation checks', () => {
    const token = signRefreshToken(fakeUser);
    const payload = verifyRefreshToken(token);
    expect(payload.v).toBe(2);
  });

  it('rejects a tampered token', () => {
    const token = signAccessToken(fakeUser);
    expect(() => verifyAccessToken(token.slice(0, -2) + 'xx')).toThrow();
  });
});
