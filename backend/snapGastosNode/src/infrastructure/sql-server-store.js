const sql = require('mssql');
const { config } = require('../config');

const dbConfig = {
  user: config.database.user,
  password: config.database.password,
  server: config.database.server,
  database: config.database.database,
  port: config.database.port,
  options: { encrypt: config.database.encrypt, trustServerCertificate: config.database.trustServerCertificate, useUTC: true },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30_000 }
};

const mapUser = (row) => row && ({ id: row.id, fullName: row.fullName, email: row.email, password: row.password, firebaseUid: row.firebaseUid, role: row.role, createdAt: row.createdAt });
const mapCategory = (row) => row && ({ id: row.id, name: row.name, icon: row.icon, colorHex: row.colorHex });
const mapExpense = (row) => row && ({ id: row.id, userId: row.userId, userName: row.userName, amount: Number(row.amount), category: row.category, date: row.date instanceof Date ? row.date.toISOString().slice(0, 10) : row.date, description: row.description, paymentMethod: row.paymentMethod, createdAt: row.createdAt });
const mapNotification = (row) => row && ({ id: row.id, userId: row.userId, userName: row.userName, title: row.title, body: row.body, read: Boolean(row.read), createdAt: row.createdAt });

class SqlServerStore {
  constructor(pool = null) { this.pool = pool; }

  async connection() {
    if (!this.pool) this.pool = await sql.connect(dbConfig);
    return this.pool;
  }

  async query(sqlText, params = {}) {
    const pool = await this.connection();
    const request = pool.request();
    for (const [name, value] of Object.entries(params)) request.input(name, value);
    return request.query(sqlText);
  }

  async findUserByEmail(email) {
    const result = await this.query(`SELECT TOP 1 id, full_name AS fullName, email, password, firebase_uid AS firebaseUid, role, created_at AS createdAt FROM dbo.users WHERE LOWER(email) = LOWER(@email)`, { email });
    return mapUser(result.recordset[0]);
  }

  async findUserByFirebaseUid(firebaseUid) {
    const result = await this.query(`SELECT TOP 1 id, full_name AS fullName, email, password, firebase_uid AS firebaseUid, role, created_at AS createdAt FROM dbo.users WHERE firebase_uid = @firebaseUid`, { firebaseUid });
    return mapUser(result.recordset[0]);
  }

  async findUserById(id) {
    const result = await this.query(`SELECT TOP 1 id, full_name AS fullName, email, password, firebase_uid AS firebaseUid, role, created_at AS createdAt FROM dbo.users WHERE id = @id`, { id });
    return mapUser(result.recordset[0]);
  }

  async listUsers() {
    const result = await this.query(`SELECT id, full_name AS fullName, email, password, firebase_uid AS firebaseUid, role, created_at AS createdAt FROM dbo.users ORDER BY created_at DESC`);
    return result.recordset.map(mapUser);
  }

  async insertUser(user) {
    await this.query(`INSERT INTO dbo.users (id, full_name, email, password, firebase_uid, role, created_at) VALUES (@id, @fullName, @email, @password, @firebaseUid, @role, @createdAt)`, user);
    return this.findUserById(user.id);
  }

  async updateUser(user) {
    await this.query(`UPDATE dbo.users SET full_name = @fullName, email = @email, password = @password, firebase_uid = @firebaseUid, role = @role WHERE id = @id`, user);
    return this.findUserById(user.id);
  }

  async deleteUser(id) {
    const pool = await this.connection();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    try {
      for (const statement of ['DELETE FROM dbo.notifications WHERE user_id = @id', 'DELETE FROM dbo.expenses WHERE user_id = @id', 'DELETE FROM dbo.users WHERE id = @id']) {
        await new sql.Request(transaction).input('id', id).query(statement);
      }
      await transaction.commit();
    } catch (error) { await transaction.rollback(); throw error; }
  }

  async listCategories() {
    const result = await this.query(`SELECT id, name, icon, color_hex AS colorHex FROM dbo.categories ORDER BY name ASC`);
    return result.recordset.map(mapCategory);
  }

  async findCategoryById(id) { const result = await this.query(`SELECT TOP 1 id, name, icon, color_hex AS colorHex FROM dbo.categories WHERE id = @id`, { id }); return mapCategory(result.recordset[0]); }
  async findCategoryByName(name) { const result = await this.query(`SELECT TOP 1 id, name, icon, color_hex AS colorHex FROM dbo.categories WHERE LOWER(name) = LOWER(@name)`, { name }); return mapCategory(result.recordset[0]); }
  async insertCategory(category) { await this.query(`INSERT INTO dbo.categories (id, name, icon, color_hex) VALUES (@id, @name, @icon, @colorHex)`, category); return this.findCategoryById(category.id); }
  async updateCategory(category) { await this.query(`UPDATE dbo.categories SET name = @name, icon = @icon, color_hex = @colorHex WHERE id = @id`, category); return this.findCategoryById(category.id); }
  async deleteCategory(id) { await this.query(`DELETE FROM dbo.categories WHERE id = @id`, { id }); }

  async listExpenses(userId = null) {
    const result = await this.query(`SELECT e.id, e.user_id AS userId, u.full_name AS userName, e.amount, e.category, e.expense_date AS date, e.description, e.payment_method AS paymentMethod, e.created_at AS createdAt FROM dbo.expenses e INNER JOIN dbo.users u ON u.id = e.user_id ${userId ? 'WHERE e.user_id = @userId' : ''} ORDER BY e.expense_date DESC, e.created_at DESC`, userId ? { userId } : {});
    return result.recordset.map(mapExpense);
  }

  async findExpenseById(id) { const result = await this.query(`SELECT TOP 1 e.id, e.user_id AS userId, u.full_name AS userName, e.amount, e.category, e.expense_date AS date, e.description, e.payment_method AS paymentMethod, e.created_at AS createdAt FROM dbo.expenses e INNER JOIN dbo.users u ON u.id = e.user_id WHERE e.id = @id`, { id }); return mapExpense(result.recordset[0]); }
  async insertExpense(expense) { await this.query(`INSERT INTO dbo.expenses (id, amount, category, expense_date, description, payment_method, user_id, created_at) VALUES (@id, @amount, @category, @date, @description, @paymentMethod, @userId, @createdAt)`, expense); return this.findExpenseById(expense.id); }
  async updateExpense(expense) { await this.query(`UPDATE dbo.expenses SET amount = @amount, category = @category, expense_date = @date, description = @description, payment_method = @paymentMethod, user_id = @userId WHERE id = @id`, expense); return this.findExpenseById(expense.id); }
  async deleteExpense(id) { await this.query(`DELETE FROM dbo.expenses WHERE id = @id`, { id }); }

  async listNotifications() {
    const result = await this.query(`SELECT n.id, n.user_id AS userId, u.full_name AS userName, n.title, n.body, n.is_read AS read, n.created_at AS createdAt FROM dbo.notifications n INNER JOIN dbo.users u ON u.id = n.user_id ORDER BY n.created_at DESC`);
    return result.recordset.map(mapNotification);
  }
  async findNotificationById(id) { const result = await this.query(`SELECT TOP 1 n.id, n.user_id AS userId, u.full_name AS userName, n.title, n.body, n.is_read AS read, n.created_at AS createdAt FROM dbo.notifications n INNER JOIN dbo.users u ON u.id = n.user_id WHERE n.id = @id`, { id }); return mapNotification(result.recordset[0]); }
  async insertNotification(notification) { await this.query(`INSERT INTO dbo.notifications (id, title, body, is_read, user_id, created_at) VALUES (@id, @title, @body, @read, @userId, @createdAt)`, notification); return this.findNotificationById(notification.id); }
  async updateNotification(notification) { await this.query(`UPDATE dbo.notifications SET title = @title, body = @body, is_read = @read, user_id = @userId WHERE id = @id`, notification); return this.findNotificationById(notification.id); }
  async deleteNotification(id) { await this.query(`DELETE FROM dbo.notifications WHERE id = @id`, { id }); }
}

module.exports = { SqlServerStore };
