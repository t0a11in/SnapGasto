const { readSubject } = require('../application/token-service');
const { forbidden, unauthorized } = require('../domain/errors');

function createAuthMiddleware(store) {
  const requireUser = async (request, _response, next) => {
    try {
      const header = request.get('Authorization');
      if (!header?.startsWith('Bearer ')) throw unauthorized();
      const user = await store.findUserByEmail(readSubject(header.slice(7)));
      if (!user) throw unauthorized();
      request.user = user;
      next();
    } catch (error) { next(error); }
  };
  const requireAdmin = (request, _response, next) => {
    if (request.user?.role !== 'ADMIN') return next(forbidden());
    return next();
  };
  return { requireUser, requireAdmin };
}

module.exports = { createAuthMiddleware };
