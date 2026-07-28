import jwt from 'jsonwebtoken';
import { config } from '../configs/config.js';

export const verifyJWT = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, config.jwt.secret, (err, decoded) => {
      if (err) reject(err);
      else resolve(decoded);
    });
  });
};
