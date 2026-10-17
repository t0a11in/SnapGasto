const { randomUUID } = require('node:crypto');
const { notFound } = require('../domain/errors');
const { money, optionalText, pastOrPresentDate, requiredText } = require('../domain/validation');

const toExpenseResponse = (expense) => ({ id: expense.id, amount: expense.amount, category: expense.category, date: expense.date, description: expense.description, paymentMethod: expense.paymentMethod });

class ExpenseService {
  constructor(store) { this.store = store; }
  async listFor(user) { return (await this.store.listExpenses(user.id)).map(toExpenseResponse); }
  async create(body, user) {
    const expense = await this.store.insertExpense({
      id: randomUUID(), userId: user.id, amount: money(body.amount), category: requiredText(body.category, 'categoría', 80),
      date: pastOrPresentDate(body.date), description: optionalText(body.description, 'descripción', 500),
      paymentMethod: requiredText(body.paymentMethod, 'método de pago', 60), createdAt: new Date()
    });
    return toExpenseResponse(expense);
  }
  async delete(expenseId, user) {
    const expense = await this.store.findExpenseById(expenseId);
    if (!expense || expense.userId !== user.id) throw notFound('Gasto no encontrado.');
    await this.store.deleteExpense(expenseId);
  }
}

module.exports = { ExpenseService };
