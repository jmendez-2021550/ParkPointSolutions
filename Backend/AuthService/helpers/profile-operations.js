import { findUserById } from './user-db.js';
import { buildUserResponse } from '../utils/user-helpers.js';
import { User, UserProfile } from '../src/users/user.model.js';

export const getUserProfileHelper = async (userId) => {
  const user = await findUserById(userId);
  if (!user) {
    const err = new Error('Usuario no encontrado');
    err.status = 404;
    throw err;
  }
  return buildUserResponse(user);
};

export const updateProfileHelper = async (userId, updates) => {
  const user = await findUserById(userId);
  if (!user) {
    const err = new Error('Usuario no encontrado');
    err.status = 404;
    throw err;
  }

  const userUpdates = {};
  if (updates.name !== undefined) userUpdates.Name = updates.name;
  if (updates.surname !== undefined) userUpdates.Surname = updates.surname;

  if (Object.keys(userUpdates).length > 0) {
    await User.update(userUpdates, { where: { Id: userId } });
  }

  if (updates.phone !== undefined) {
    await UserProfile.update({ Phone: updates.phone }, { where: { UserId: userId } });
  }

  const updated = await findUserById(userId);
  return buildUserResponse(updated);
};
