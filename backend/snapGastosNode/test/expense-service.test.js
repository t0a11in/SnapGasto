const test = require('node:test');
const assert = require('node:assert/strict');
const { ExpenseService } = require('../src/application/expense-service');

test('ExpenseService sólo elimina gastos que pertenecen al usuario autenticado', async () => {
  const deleted = [];
  const store = {
    async findExpenseById() { return { id: '11111111-1111-4111-8111-111111111111', userId: 'u-1' }; },
    async deleteExpense(id) { deleted.push(id); }
  };
  const service = new ExpenseService(store);
  await service.delete('11111111-1111-4111-8111-111111111111', { id: 'u-1' });
  assert.deepEqual(deleted, ['11111111-1111-4111-8111-111111111111']);
  await assert.rejects(() => service.delete('11111111-1111-4111-8111-111111111111', { id: 'u-2' }), { status: 404 });
});
