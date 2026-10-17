const bcrypt = require('bcryptjs');
const { randomUUID } = require('node:crypto');
const { config } = require('../config');
const { conflict, unauthorized } = require('../domain/errors');
const { email, password, requiredText } = require('../domain/validation');
const { createAccessToken } = require('./token-service');

// Spring BCrypt emite el prefijo 2a. bcryptjs verifica 2a/2b, pero guardar 2a
// evita diferencias de formato cuando la misma tabla users es usada por otra API.
const hashPassword = async (value) => (await bcrypt.hash(value, 10)).replace(/^\$2b\$/, '$2a$');

const toUserResponse = (user) => ({ id: user.id, fullName: user.fullName, email: user.email, role: user.role });
const toAuthResponse = (user) => ({ accessToken: createAccessToken(user.email), user: toUserResponse(user) });

class AuthService {
  constructor(store, identityProvider) {
    this.store = store;
    this.identityProvider = identityProvider;
  }

  async register(body) {
    const normalizedEmail = email(body.email);
    if (await this.store.findUserByEmail(normalizedEmail)) throw conflict('Ya existe una cuenta con ese correo.');
    const user = await this.store.insertUser({
      id: randomUUID(),
      fullName: requiredText(body.fullName, 'nombre', 120),
      email: normalizedEmail,
      password: await hashPassword(password(body.password)),
      firebaseUid: null,
      role: this.isBootstrapAdmin(normalizedEmail) ? 'ADMIN' : 'USER',
      createdAt: new Date()
    });
    return toAuthResponse(user);
  }

  async login(body) {
    const user = await this.store.findUserByEmail(email(body.email));
    if (!user || !(await bcrypt.compare(password(body.password), user.password))) {
      throw unauthorized('Correo o contraseña incorrectos.');
    }
    return toAuthResponse(user);
  }

  async loginWithGoogle(body) {
    const identity = await this.identityProvider.verifyGoogleIdentity(requiredText(body.idToken, 'token de Firebase'));
    let user = await this.store.findUserByFirebaseUid(identity.uid) || await this.store.findUserByEmail(identity.email);
    if (!user) {
      user = await this.store.insertUser({
        id: randomUUID(), fullName: identity.displayName.trim().slice(0, 120), email: identity.email,
        password: await hashPassword(randomUUID()), firebaseUid: identity.uid,
        role: this.isBootstrapAdmin(identity.email) ? 'ADMIN' : 'USER', createdAt: new Date()
      });
    } else {
      if (user.firebaseUid && user.firebaseUid !== identity.uid) throw conflict('Este correo ya está vinculado a otra cuenta Google.');
      user = await this.store.updateUser({ ...user, firebaseUid: identity.uid });
    }
    return toAuthResponse(user);
  }

  async session(user) { return toUserResponse(user); }
  isBootstrapAdmin(userEmail) { return Boolean(config.bootstrapAdminEmail) && config.bootstrapAdminEmail === userEmail; }
}

module.exports = { AuthService, toUserResponse, hashPassword };
