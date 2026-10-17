const jwt = require('jsonwebtoken');
const { config } = require('../config');
const { unauthorized } = require('../domain/errors');

function createAccessToken(email) {
  return jwt.sign({}, config.jwtSecret, {
    algorithm: 'HS256',
    subject: email,
    expiresIn: `${config.jwtExpirationMinutes}m`
  });
}

function readSubject(token) {
  try {
    const payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
    if (typeof payload.sub !== 'string' || !payload.sub) throw unauthorized();
    return payload.sub;
  } catch (_) {
    throw unauthorized();
  }
}

module.exports = { createAccessToken, readSubject };
