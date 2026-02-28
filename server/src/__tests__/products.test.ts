import request from 'supertest';
import app from '../server';

describe('GET /api/products', () => {
  it('returns 401 when no token is provided', async () => {
    const response = await request(app).get('/api/products');
    expect(response.status).toBe(401);
  });
});
