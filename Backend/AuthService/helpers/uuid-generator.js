import { randomBytes } from 'crypto';

const ALPHABET = '123456789ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';

export const generateShortUUID = () => {
  const bytes = randomBytes(12);
  let result = '';
  for (let i = 0; i < 12; i += 1) {
    result += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return result;
};

export const generateUserId = () => `usr_${generateShortUUID()}`;

export const isValidUserId = (id) => {
  if (!id || typeof id !== 'string') return false;
  return /^usr_[123456789ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz]{12}$/.test(id);
};
