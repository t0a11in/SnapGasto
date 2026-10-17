const paths = {
  '/api/auth/register': { post: { tags: ['Autenticación'], summary: 'Registrar una cuenta' } },
  '/api/auth/login': { post: { tags: ['Autenticación'], summary: 'Iniciar sesión' } },
  '/api/auth/google': { post: { tags: ['Autenticación'], summary: 'Iniciar sesión con Google/Firebase' } },
  '/api/auth/session': { get: { tags: ['Sesión'], security: [{ bearerAuth: [] }] } },
  '/api/users/me': { get: { tags: ['Usuarios'], security: [{ bearerAuth: [] }] } },
  '/api/expenses': { get: { tags: ['Gastos'], security: [{ bearerAuth: [] }] }, post: { tags: ['Gastos'], security: [{ bearerAuth: [] }] } },
  '/api/expenses/{expenseId}': { delete: { tags: ['Gastos'], security: [{ bearerAuth: [] }] } },
  '/api/admin/users': { get: { tags: ['Administración: usuarios'], security: [{ bearerAuth: [] }] }, post: { tags: ['Administración: usuarios'], security: [{ bearerAuth: [] }] } },
  '/api/admin/users/{userId}': { put: { tags: ['Administración: usuarios'], security: [{ bearerAuth: [] }] }, delete: { tags: ['Administración: usuarios'], security: [{ bearerAuth: [] }] } },
  '/api/admin/categories': { get: { tags: ['Administración: categorías'], security: [{ bearerAuth: [] }] }, post: { tags: ['Administración: categorías'], security: [{ bearerAuth: [] }] } },
  '/api/admin/categories/{categoryId}': { put: { tags: ['Administración: categorías'], security: [{ bearerAuth: [] }] }, delete: { tags: ['Administración: categorías'], security: [{ bearerAuth: [] }] } },
  '/api/admin/expenses': { get: { tags: ['Administración: gastos'], security: [{ bearerAuth: [] }] }, post: { tags: ['Administración: gastos'], security: [{ bearerAuth: [] }] } },
  '/api/admin/expenses/{expenseId}': { put: { tags: ['Administración: gastos'], security: [{ bearerAuth: [] }] }, delete: { tags: ['Administración: gastos'], security: [{ bearerAuth: [] }] } },
  '/api/admin/notifications': { get: { tags: ['Administración: notificaciones'], security: [{ bearerAuth: [] }] }, post: { tags: ['Administración: notificaciones'], security: [{ bearerAuth: [] }] } },
  '/api/admin/notifications/{notificationId}': { put: { tags: ['Administración: notificaciones'], security: [{ bearerAuth: [] }] }, delete: { tags: ['Administración: notificaciones'], security: [{ bearerAuth: [] }] } }
};

const openApiDocument = {
  openapi: '3.0.3',
  info: { title: 'SnapGasto API · Node/Express', version: 'v1', description: 'Contrato compatible con la implementación Spring Boot.' },
  components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } },
  paths
};

module.exports = { openApiDocument };
