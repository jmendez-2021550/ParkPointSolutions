import { User } from '../src/users/user.model.js';

export const findUserById = async (userId) => {
  if (!userId) return null;
  return User.findByPk(userId);
};

export const findUserByEmail = async (email) => {
  if (!email) return null;
  return User.findOne({ where: { Email: email.toLowerCase() } });
};
