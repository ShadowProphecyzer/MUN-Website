const jwt = require('jsonwebtoken');

// Read secret and expiry from env or set defaults
const JWT_SECRET = process.env.JWT_SECRET || 'defaultSecret';
const JWT_EXPIRES_IN = '7d'; // 7 days

/**
 * Generate a JWT for a given user ID and optional payload
 * @param {string} userId 
 * @param {object} payload - additional data to encode
 * @returns {string} signed JWT token
 */
function generateToken(userId, payload = {}) {
  const tokenPayload = { id: userId, ...payload };
  return jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify a JWT token string and return decoded payload
 * @param {string} token 
 * @returns {object} decoded payload or throws error
 */
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

/**
 * Decode a JWT token without verifying signature
 * @param {string} token 
 * @returns {object} decoded payload or null
 */
function decodeToken(token) {
  return jwt.decode(token);
}

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
};
