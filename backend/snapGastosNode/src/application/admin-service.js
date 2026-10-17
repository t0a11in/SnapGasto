const { randomUUID } = require('node:crypto');
const { hashPassword } = require('./auth-service');
const { conflict, badRequest, notFound } = require('../domain/errors');
const { email, money, optionalText, password, pastOrPresentDate, requiredText, uuid } = require('../domain/validation');

const adminUser = (user) => ({ id: user.id, fullName: user.fullName, email: user.email, role: user.role, createdAt: user.createdAt });
const adminExpense = (expense) => ({ id: expense.id, userId: expense.userId, userName: expense.userName, amount: expense.amount, category: expense.category, date: expense.date, description: expense.description, paymentMethod: expense.paymentMethod });
const notification = (item) => ({ id: item.id, userId: item.userId, userName: item.userName, title: item.title, body: item.body, read: item.read, createdAt: item.createdAt });

class AdminService {
  constructor(store) { this.store = store; }
  async listUsers() { return (await this.store.listUsers()).map(adminUser); }
  async createUser(body) {
    const normalizedEmail = email(body.email);
    if (await this.store.findUserByEmail(normalizedEmail)) throw conflict('Ya existe una cuenta con ese correo.');
    const role = body.role === 'ADMIN' ? 'ADMIN' : body.role === 'USER' ? 'USER' : (() => { throw badRequest('El rol es obligatorio.'); })();
    const created = await this.store.insertUser({ id: randomUUID(), fullName: requiredText(body.fullName, 'nombre', 120), email: normalizedEmail, password: await hashPassword(password(body.password)), firebaseUid: null, role, createdAt: new Date() });
    return adminUser(created);
  }
  async updateUser(userId, body) {
    const existing = await this.requireUser(userId);
    const normalizedEmail = email(body.email);
    const duplicated = await this.store.findUserByEmail(normalizedEmail);
    if (duplicated && duplicated.id !== userId) throw conflict('Ya existe una cuenta con ese correo.');
    const role = body.role === 'ADMIN' || body.role === 'USER' ? body.role : (() => { throw badRequest('El rol es obligatorio.'); })();
    const nextPassword = password(body.password, false);
    const updated = await this.store.updateUser({ ...existing, fullName: requiredText(body.fullName, 'nombre', 120), email: normalizedEmail, role, password: nextPassword ? await hashPassword(nextPassword) : existing.password });
    return adminUser(updated);
  }
  async deleteUser(userId, currentUser) {
    if (userId === currentUser.id) throw badRequest('No puedes eliminar tu propia cuenta.');
    await this.requireUser(userId); await this.store.deleteUser(userId);
  }

  async listCategories() { return this.store.listCategories(); }
  async createCategory(body) {
    const name = requiredText(body.name, 'nombre', 80); if (await this.store.findCategoryByName(name)) throw conflict('Ya existe una categoría con ese nombre.');
    return this.store.insertCategory({ id: randomUUID(), name, icon: optionalText(body.icon, 'icono', 80), colorHex: this.color(body.colorHex) });
  }
  async updateCategory(id, body) {
    const category = await this.requireCategory(id); const name = requiredText(body.name, 'nombre', 80); const duplicated = await this.store.findCategoryByName(name);
    if (duplicated && duplicated.id !== id) throw conflict('Ya existe una categoría con ese nombre.');
    return this.store.updateCategory({ ...category, name, icon: optionalText(body.icon, 'icono', 80), colorHex: this.color(body.colorHex) });
  }
  async deleteCategory(id) { await this.requireCategory(id); await this.store.deleteCategory(id); }

  async listExpenses() { return (await this.store.listExpenses()).map(adminExpense); }
  async createExpense(body) { return adminExpense(await this.saveExpense(null, body)); }
  async updateExpense(id, body) { await this.requireExpense(id); return adminExpense(await this.saveExpense(id, body)); }
  async deleteExpense(id) { await this.requireExpense(id); await this.store.deleteExpense(id); }

  async listNotifications() { return (await this.store.listNotifications()).map(notification); }
  async createNotification(body) { return notification(await this.saveNotification(null, body)); }
  async updateNotification(id, body) { await this.requireNotification(id); return notification(await this.saveNotification(id, body)); }
  async deleteNotification(id) { await this.requireNotification(id); await this.store.deleteNotification(id); }

  async saveExpense(id, body) {
    const userId = uuid(body.userId, 'usuario'); await this.requireUser(userId);
    const data = { id: id || randomUUID(), userId, amount: money(body.amount), category: requiredText(body.category, 'categoría', 80), date: pastOrPresentDate(body.date), description: optionalText(body.description, 'descripción', 500), paymentMethod: requiredText(body.paymentMethod, 'método de pago', 60), createdAt: new Date() };
    return id ? this.store.updateExpense(data) : this.store.insertExpense(data);
  }
  async saveNotification(id, body) {
    const userId = uuid(body.userId, 'usuario'); await this.requireUser(userId);
    const data = { id: id || randomUUID(), userId, title: requiredText(body.title, 'título', 140), body: requiredText(body.body, 'mensaje', 1000), read: Boolean(body.read), createdAt: new Date() };
    return id ? this.store.updateNotification(data) : this.store.insertNotification(data);
  }
  color(value) { const color = optionalText(value, 'color', 7); if (color && !/^#[0-9a-fA-F]{6}$/.test(color)) throw badRequest('El color debe usar formato hexadecimal #RRGGBB.'); return color; }
  async requireUser(id) { const value = await this.store.findUserById(id); if (!value) throw notFound('Usuario no encontrado.'); return value; }
  async requireCategory(id) { const value = await this.store.findCategoryById(id); if (!value) throw notFound('Categoría no encontrada.'); return value; }
  async requireExpense(id) { const value = await this.store.findExpenseById(id); if (!value) throw notFound('Gasto no encontrado.'); return value; }
  async requireNotification(id) { const value = await this.store.findNotificationById(id); if (!value) throw notFound('Notificación no encontrada.'); return value; }
}

module.exports = { AdminService };
