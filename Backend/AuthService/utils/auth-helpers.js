import crypto from 'crypto';

export const generateEmailVerificationToken = () => {
  return generateSecureToken(32);
};

export const generatePasswordResetToken = () => {
  return generateSecureToken(32);
};

const generateSecureToken = (length) => {
  const bytes = crypto.randomBytes(length);
  return bytes
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};
