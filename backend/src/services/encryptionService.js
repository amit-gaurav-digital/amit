const crypto = require('crypto');

class EncryptionService {
  constructor() {
    // Use environment variable or generate default key
    // In production, store this securely in KMS or Vault
    this.encryptionKey = process.env.ENCRYPTION_KEY ||
      crypto.scryptSync(process.env.JWT_SECRET || 'default-secret', 'salt', 32);
    this.algorithm = 'aes-256-gcm';
  }

  /**
   * Encrypt sensitive data (tokens, credentials)
   * @param {string} text - Data to encrypt
   * @returns {string} Encrypted data (iv:encryptedData:authTag in base64)
   */
  encrypt(text) {
    if (!text) return null;

    try {
      // Generate random IV for each encryption
      const iv = crypto.randomBytes(16);

      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);

      // Encrypt
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Get auth tag
      const authTag = cipher.getAuthTag();

      // Return concatenated: iv:encrypted:authTag (all base64)
      const result = `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
      return result;
    } catch (error) {
      console.error('Encryption error:', error.message);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   * @param {string} encryptedText - Encrypted data (from encrypt())
   * @returns {string} Decrypted data
   */
  decrypt(encryptedText) {
    if (!encryptedText) return null;

    try {
      // Split the encrypted text
      const parts = encryptedText.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted format');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      const authTag = Buffer.from(parts[2], 'hex');

      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
      decipher.setAuthTag(authTag);

      // Decrypt
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error.message);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Hash password for storage
   * @param {string} password - Password to hash
   * @returns {string} Hashed password
   */
  hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  /**
   * Compare password with hash
   * @param {string} password - Plain password
   * @param {string} hash - Hash to compare against
   * @returns {boolean} True if match
   */
  comparePassword(password, hash) {
    return this.hashPassword(password) === hash;
  }

  /**
   * Generate random token
   * @param {number} length - Token length
   * @returns {string} Random token
   */
  generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hash token for storage (one-way)
   * @param {string} token - Token to hash
   * @returns {string} Hashed token
   */
  hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Encrypt PII for GDPR compliance
   * @param {object} data - Data to encrypt
   * @returns {object} Encrypted data with encrypted flag
   */
  encryptPII(data) {
    if (!data) return data;

    const encrypted = {};
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string' && value.length > 0) {
        encrypted[key] = this.encrypt(value);
      } else {
        encrypted[key] = value;
      }
    }
    encrypted._encrypted = true;

    return encrypted;
  }

  /**
   * Decrypt PII
   * @param {object} data - Encrypted data
   * @returns {object} Decrypted data
   */
  decryptPII(data) {
    if (!data || !data._encrypted) return data;

    const decrypted = {};
    for (const [key, value] of Object.entries(data)) {
      if (key === '_encrypted') continue;
      if (typeof value === 'string' && value.includes(':')) {
        try {
          decrypted[key] = this.decrypt(value);
        } catch {
          decrypted[key] = value;
        }
      } else {
        decrypted[key] = value;
      }
    }

    return decrypted;
  }
}

module.exports = new EncryptionService();
