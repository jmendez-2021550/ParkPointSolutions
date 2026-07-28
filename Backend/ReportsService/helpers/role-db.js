import { UserRole, Role } from '../src/roles/role.model.js';

export const getUserRoleNames = async (userId) => {
  const userRoles = await UserRole.findAll({
    where: { UserId: userId },
    include: [{ model: Role, as: 'Role' }],
  });
  return userRoles.map((ur) => ur.Role?.Name).filter(Boolean);
};
