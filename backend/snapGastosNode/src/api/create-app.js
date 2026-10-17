const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const { ApiError } = require('../domain/errors');
const { createAuthMiddleware } = require('./auth-middleware');
const { openApiDocument } = require('./openapi');
const { config } = require('../config');

function createApp({ authService, expenseService, adminService, store }) {
  const app = express();
  const { requireUser, requireAdmin } = createAuthMiddleware(store);
  app.use(cors({ origin: (origin, callback) => !origin || config.allowedOrigins.some((value) => new RegExp(`^${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace('\\*', '.*')}$`).test(origin)) ? callback(null, true) : callback(new Error('Origen no permitido.')), methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allowedHeaders: ['Authorization', 'Content-Type'] }));
  app.use(express.json());
  app.get('/openapi/v1.json', (_request, response) => response.json(openApiDocument));
  app.use('/swagger-ui', swaggerUi.serve, swaggerUi.setup(openApiDocument));

  const asyncRoute = (handler) => (request, response, next) => Promise.resolve(handler(request, response, next)).catch(next);
  app.post('/api/auth/register', asyncRoute(async (request, response) => response.status(201).json(await authService.register(request.body))));
  app.post('/api/auth/login', asyncRoute(async (request, response) => response.json(await authService.login(request.body))));
  app.post('/api/auth/google', asyncRoute(async (request, response) => response.json(await authService.loginWithGoogle(request.body))));
  app.get('/api/auth/session', requireUser, asyncRoute(async (request, response) => response.json(await authService.session(request.user))));
  app.get('/api/users/me', requireUser, (request, response) => response.json({ id: request.user.id, fullName: request.user.fullName, email: request.user.email, role: request.user.role }));
  app.get('/api/expenses', requireUser, asyncRoute(async (request, response) => response.json(await expenseService.listFor(request.user))));
  app.post('/api/expenses', requireUser, asyncRoute(async (request, response) => response.status(201).json(await expenseService.create(request.body, request.user))));
  app.delete('/api/expenses/:expenseId', requireUser, asyncRoute(async (request, response) => { await expenseService.delete(request.params.expenseId, request.user); response.status(204).end(); }));

  const admin = express.Router();
  admin.use(requireUser, requireAdmin);
  admin.get('/users', asyncRoute(async (_request, response) => response.json(await adminService.listUsers())));
  admin.post('/users', asyncRoute(async (request, response) => response.status(201).json(await adminService.createUser(request.body))));
  admin.put('/users/:userId', asyncRoute(async (request, response) => response.json(await adminService.updateUser(request.params.userId, request.body))));
  admin.delete('/users/:userId', asyncRoute(async (request, response) => { await adminService.deleteUser(request.params.userId, request.user); response.status(204).end(); }));
  admin.get('/categories', asyncRoute(async (_request, response) => response.json(await adminService.listCategories())));
  admin.post('/categories', asyncRoute(async (request, response) => response.status(201).json(await adminService.createCategory(request.body))));
  admin.put('/categories/:categoryId', asyncRoute(async (request, response) => response.json(await adminService.updateCategory(request.params.categoryId, request.body))));
  admin.delete('/categories/:categoryId', asyncRoute(async (request, response) => { await adminService.deleteCategory(request.params.categoryId); response.status(204).end(); }));
  admin.get('/expenses', asyncRoute(async (_request, response) => response.json(await adminService.listExpenses())));
  admin.post('/expenses', asyncRoute(async (request, response) => response.status(201).json(await adminService.createExpense(request.body))));
  admin.put('/expenses/:expenseId', asyncRoute(async (request, response) => response.json(await adminService.updateExpense(request.params.expenseId, request.body))));
  admin.delete('/expenses/:expenseId', asyncRoute(async (request, response) => { await adminService.deleteExpense(request.params.expenseId); response.status(204).end(); }));
  admin.get('/notifications', asyncRoute(async (_request, response) => response.json(await adminService.listNotifications())));
  admin.post('/notifications', asyncRoute(async (request, response) => response.status(201).json(await adminService.createNotification(request.body))));
  admin.put('/notifications/:notificationId', asyncRoute(async (request, response) => response.json(await adminService.updateNotification(request.params.notificationId, request.body))));
  admin.delete('/notifications/:notificationId', asyncRoute(async (request, response) => { await adminService.deleteNotification(request.params.notificationId); response.status(204).end(); }));
  app.use('/api/admin', admin);

  app.use((error, _request, response, _next) => {
    if (error instanceof ApiError) return response.status(error.status).json({ message: error.message });
    if (error?.number === 2627 || error?.number === 2601) return response.status(409).json({ message: 'El registro ya existe.' });
    console.error(error);
    return response.status(500).json({ message: 'Ocurrió un error interno.' });
  });
  return app;
}

module.exports = { createApp };
