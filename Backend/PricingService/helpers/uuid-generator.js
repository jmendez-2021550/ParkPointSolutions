import { randomBytes } from 'crypto';

const alphabet = '123456789ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';

export const generateShortUUID = () => {
  const bytes = randomBytes(12);
  let result = '';
  for (let i = 0; i < 12; i += 1) {
    result += alphabet[bytes[i] % alphabet.length];
  }
  return result;
};

export const generateUserId = () => `usr_${generateShortUUID()}`;
