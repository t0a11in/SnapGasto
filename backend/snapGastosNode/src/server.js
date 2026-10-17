const { config } = require('./config');
const { AuthService } = require('./application/auth-service');
const { ExpenseService } = require('./application/expense-service');
const { AdminService } = require('./application/admin-service');
const { SqlServerStore } = require('./infrastructure/sql-server-store');
const { verifyGoogleIdentity } = require('./infrastructure/firebase-identity-provider');
const { createApp } = require('./api/create-app');

const store = new SqlServerStore();
const app = createApp({
  store,
  authService: new AuthService(store, { verifyGoogleIdentity }),
  expenseService: new ExpenseService(store),
  adminService: new AdminService(store)
});

app.listen(config.port, () => console.log(`SnapGasto Node API disponible en http://localhost:${config.port}`));
