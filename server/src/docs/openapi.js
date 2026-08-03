export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'openshelf API',
    version: '1.0.0',
    description: 'Book discovery, shelves, reviews, and a social graph, backed by a local cache of Open Library data.',
  },
  servers: [{ url: '/api' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/auth/register': { post: { summary: 'Create an account', tags: ['auth'], responses: { 201: { description: 'Created' } } } },
    '/auth/login': { post: { summary: 'Log in', tags: ['auth'], responses: { 200: { description: 'OK' } } } },
    '/auth/refresh': { post: { summary: 'Rotate the access token via refresh cookie', tags: ['auth'], responses: { 200: { description: 'OK' } } } },
    '/auth/logout': { post: { summary: 'Revoke the refresh token', tags: ['auth'], responses: { 204: { description: 'No Content' } } } },
    '/auth/me': { get: { summary: 'Current user', tags: ['auth'], responses: { 200: { description: 'OK' } } } },
    '/books': {
      get: {
        summary: 'Cursor-paginated, faceted book search',
        tags: ['books'],
        parameters: [
          { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Full-text query (title/author/subject)' },
          { name: 'subject', in: 'query', schema: { type: 'string' } },
          { name: 'year', in: 'query', schema: { type: 'integer' } },
          { name: 'cursor', in: 'query', schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 12 } },
        ],
        responses: { 200: { description: 'OK' } },
      },
    },
    '/books/subjects': { get: { summary: 'Top subjects by book count', tags: ['books'], responses: { 200: { description: 'OK' } } } },
    '/books/{id}': {
      get: {
        summary: 'Book detail with reviews and recommendations',
        tags: ['books'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'OK' }, 404: { description: 'Not found' } },
      },
    },
    '/shelf': {
      get: { summary: "Current user's shelves, grouped by status", tags: ['shelf'], responses: { 200: { description: 'OK' } } },
      post: { summary: 'Add/move a book to a shelf (want/reading/read)', tags: ['shelf'], responses: { 201: { description: 'Created' } } },
    },
    '/shelf/{bookId}': {
      delete: { summary: 'Remove a book from all shelves', tags: ['shelf'], parameters: [{ name: 'bookId', in: 'path', required: true, schema: { type: 'string' } }], responses: { 204: { description: 'No Content' } } },
    },
    '/reviews': {
      post: { summary: 'Create or update your review for a book', tags: ['reviews'], responses: { 201: { description: 'Created' } } },
    },
    '/reviews/{id}': {
      delete: { summary: 'Delete your own review', tags: ['reviews'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 204: { description: 'No Content' } } },
    },
    '/users/{id}': { get: { summary: 'Public profile with follow counts', tags: ['users'], responses: { 200: { description: 'OK' } } } },
    '/users/me/avatar': { post: { summary: 'Upload an avatar image', tags: ['users'], responses: { 200: { description: 'OK' } } } },
    '/users/{userId}/follow': {
      post: { summary: 'Follow a user', tags: ['social'], responses: { 201: { description: 'Created' } } },
      delete: { summary: 'Unfollow a user', tags: ['social'], responses: { 204: { description: 'No Content' } } },
    },
    '/activity/feed': {
      get: {
        summary: 'Activity feed (global or following-only)',
        tags: ['social'],
        parameters: [{ name: 'scope', in: 'query', schema: { type: 'string', enum: ['global', 'following'] } }],
        responses: { 200: { description: 'OK' } },
      },
    },
  },
};
