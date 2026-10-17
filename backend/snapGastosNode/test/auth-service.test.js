const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const { AuthService } = require('../src/application/auth-service');
const { readSubject } = require('../src/application/token-service');

test('AuthService registra una cuenta, la autentica y emite un JWT interoperable', async () => {
  const users = [];
  const store = {
    async findUserByEmail(email) { return users.find((item) => item.email === email) ?? null; },
    async insertUser(user) { users.push(user); return user; }
  };
  const service = new AuthService(store, {});
  const registered = await service.register({ fullName: 'Ana Pérez', email: 'ANA@EXAMPLE.COM', password: 'secreto123' });
  assert.equal(registered.user.email, 'ana@example.com');
  assert.equal(readSubject(registered.accessToken), 'ana@example.com');
  assert.equal(await bcrypt.compare('secreto123', users[0].password), true);
  const loggedIn = await service.login({ email: 'ana@example.com', password: 'secreto123' });
  assert.equal(loggedIn.user.id, registered.user.id);
});
