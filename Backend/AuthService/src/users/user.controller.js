import { findUserById } from '../../helpers/user-db.js';
import {
  getUserRoleNames,
  getUsersByRole as repoGetUsersByRole,
  setUserSingleRole,
} from '../../helpers/role-db.js';
import { ALLOWED_ROLES, ADMIN_ROLE, SUPER_ADMIN_ROLE } from '../../helpers/role-constants.js';
import { buildUserResponse } from '../../utils/user-helpers.js';
import { asyncHandler } from '../../middlewares/server-genericError-handler.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { User, UserEmail } from './user.model.js';
import { Role, UserRole } from '../auth/role.model.js';

const ensureAdmin = async (req) => {
  const currentUserId = req.userId;
  if (!currentUserId) return false;
  const roles =
    req.user?.UserRoles?.map((ur) => ur.Role?.Name).filter(Boolean) ??
    (await getUserRoleNames(currentUserId));
  return roles.includes(ADMIN_ROLE) || roles.includes(SUPER_ADMIN_ROLE);
};

export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.findAll({
    attributes: ['Id', 'Name', 'Surname', 'Username', 'Email', 'Status', 'CreatedAt'],
    include: [
      { model: UserEmail, as: 'UserEmail', attributes: ['EmailVerified'] },
      {
        model: UserRole,
        as: 'UserRoles',
        include: [{ model: Role, as: 'Role', attributes: ['Name'] }],
      },
    ],
    order: [['CreatedAt', 'DESC']],
  });

  const payload = users.map((u) => ({
    id: u.Id,
    name: u.Name,
    surname: u.Surname,
    username: u.Username,
    email: u.Email,
    status: u.Status,
    emailVerified: u.UserEmail?.EmailVerified ?? false,
    role: u.UserRoles?.[0]?.Role?.Name || 'USER_ROLE',
    createdAt: u.CreatedAt,
  }));

  return res.status(200).json(payload);
});

export const updateUserRole = [
  validateJWT,
  asyncHandler(async (req, res) => {
    if (!(await ensureAdmin(req))) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { userId } = req.params;
    const { roleName, role } = req.body || {};
    const normalized = ((roleName || role) || '').trim().toUpperCase();

    if (!ALLOWED_ROLES.includes(normalized)) {
      return res.status(400).json({ success: false, message: 'Role not allowed. Use ADMIN_ROLE or USER_ROLE' });
    }

    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { updatedUser } = await setUserSingleRole(user, normalized);
    return res.status(200).json(buildUserResponse(updatedUser));
  }),
];

export const getUserRoles = [
  validateJWT,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const roles = await getUserRoleNames(userId);
    return res.status(200).json(roles);
  }),
];

export const getUsersByRole = [
  validateJWT,
  asyncHandler(async (req, res) => {
    if (!(await ensureAdmin(req))) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { roleName } = req.params;
    const normalized = (roleName || '').trim().toUpperCase();

    if (!ALLOWED_ROLES.includes(normalized)) {
      return res.status(400).json({ success: false, message: 'Role not allowed. Use ADMIN_ROLE or USER_ROLE' });
    }

    const users = await repoGetUsersByRole(normalized);
    const payload = users.map(buildUserResponse);
    return res.status(200).json(payload);
  }),
];

export const deleteUser = [
  validateJWT,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const requesterId = req.userId;

    const isAdmin = await ensureAdmin(req);
    const isSelf = requesterId === userId;

    if (!isSelf && !isAdmin) {
      return res.status(403).json({ success: false, message: 'No tienes permiso para eliminar este usuario' });
    }

    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    await user.destroy();
    return res.status(200).json({ success: true, message: 'Usuario eliminado correctamente' });
  }),
];
