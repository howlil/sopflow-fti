import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const KEY_LENGTH = 32;
const CIPHERTEXT_VERSION = 'v2';
const AAD = Buffer.from('sopflow-tte-p12-passphrase:v2', 'utf8');
const DEVELOPMENT_FALLBACK_SECRET =
  'development-only-tte-encryption-secret-change-before-production';

function resolveServerSecret(): string {
  const configured = process.env.TTE_ENCRYPTION_SECRET?.trim();
  if (configured) {
    return configured;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('TTE_ENCRYPTION_SECRET wajib dikonfigurasi pada production');
  }
  return DEVELOPMENT_FALLBACK_SECRET;
}

/**
 * Key diturunkan dari dua faktor: PIN pengguna + secret server.
 * Dengan demikian dump database saja tidak cukup untuk brute-force PIN secara offline.
 */
function deriveKey(pin: string, salt: Buffer): Buffer {
  const serverSecret = resolveServerSecret();
  return crypto.scryptSync(`${serverSecret}\u0000${pin}`, salt, KEY_LENGTH);
}

/**
 * Encrypt P12 passphrase menggunakan AES-256-GCM.
 * Format: v2:hex(salt):hex(iv):hex(encrypted):hex(authTag)
 */
export function encryptP12Passphrase(passphrase: string, pin: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey(pin, salt);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  cipher.setAAD(AAD);
  const encrypted = Buffer.concat([cipher.update(passphrase, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    CIPHERTEXT_VERSION,
    salt.toString('hex'),
    iv.toString('hex'),
    encrypted.toString('hex'),
    tag.toString('hex'),
  ].join(':');
}

export function decryptP12Passphrase(encryptedData: string, pin: string): string {
  const parts = encryptedData.split(':');
  if (parts.length !== 5 || parts[0] !== CIPHERTEXT_VERSION) {
    throw new Error('Invalid encrypted data format');
  }

  const salt = Buffer.from(parts[1], 'hex');
  const iv = Buffer.from(parts[2], 'hex');
  const encrypted = Buffer.from(parts[3], 'hex');
  const tag = Buffer.from(parts[4], 'hex');
  const key = deriveKey(pin, salt);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAAD(AAD);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}
