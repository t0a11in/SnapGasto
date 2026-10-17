const { config } = require('../config');
const { ApiError } = require('../domain/errors');

async function verifyGoogleIdentity(idToken) {
  if (!config.firebaseEnabled) {
    throw new ApiError(503, 'El acceso con Google no está configurado.');
  }
  const { applicationDefault, getApps, initializeApp } = require('firebase-admin/app');
  const { getAuth } = require('firebase-admin/auth');
  if (!getApps().length) initializeApp({ credential: applicationDefault(), projectId: config.firebaseProjectId || undefined });
  const decoded = await getAuth().verifyIdToken(idToken);
  if (!decoded.email || decoded.email_verified === false || decoded.firebase?.sign_in_provider !== 'google.com') {
    throw new ApiError(401, 'El token no corresponde a una cuenta Google verificada.');
  }
  return { uid: decoded.uid, email: decoded.email.toLowerCase(), displayName: decoded.name || decoded.email };
}

module.exports = { verifyGoogleIdentity };
