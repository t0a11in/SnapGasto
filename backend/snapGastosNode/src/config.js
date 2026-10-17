const requireValue = (name, fallback) => process.env[name] ?? fallback;

const boolValue = (name, fallback) => {
  const value = requireValue(name, fallback ? 'true' : 'false');
  return value.toLowerCase() === 'true';
};

const config = Object.freeze({
  port: Number(requireValue('PORT', '8083')),
  database: {
    server: requireValue('DB_HOST', 'localhost'),
    port: Number(requireValue('DB_PORT', '1433')),
    database: requireValue('DB_NAME', 'snap_gastos'),
    user: requireValue('DB_USER', 'sa'),
    password: requireValue('DB_PASSWORD', ''),
    encrypt: boolValue('DB_ENCRYPT', true),
    trustServerCertificate: boolValue('DB_TRUST_SERVER_CERTIFICATE', true)
  },
  jwtSecret: requireValue('JWT_SECRET', 'change-this-development-secret-to-a-value-with-at-least-32-characters'),
  jwtExpirationMinutes: Number(requireValue('JWT_EXPIRATION_MINUTES', '120')),
  bootstrapAdminEmail: requireValue('APP_BOOTSTRAP_ADMIN_EMAIL', '').trim().toLowerCase(),
  firebaseEnabled: boolValue('FIREBASE_ENABLED', false),
  firebaseProjectId: requireValue('FIREBASE_PROJECT_ID', ''),
  allowedOrigins: requireValue('CORS_ALLOWED_ORIGINS', 'http://localhost:*,http://127.0.0.1:*').split(',').map((value) => value.trim())
});

if (config.jwtSecret.length < 32) {
  throw new Error('JWT_SECRET debe tener al menos 32 caracteres.');
}

module.exports = { config };
