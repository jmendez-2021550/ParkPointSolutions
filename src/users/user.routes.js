import { Router } from 'express';
import {
  updateUserRole,
  getUserRoles,
  getUsersByRole,
  getAllUsers,
  deleteUser,
} from './user.controller.js';

const router = Router();

// GET /api/v1/users
router.get('/', getAllUsers);

// PUT /api/v1/users/:userId/role
router.put('/:userId/role', ...updateUserRole);

// GET /api/v1/users/:userId/roles
router.get('/:userId/roles', ...getUserRoles);

// DELETE /api/v1/users/:userId
router.delete('/:userId', ...deleteUser);

// GET /api/v1/users/by-role/:roleName
router.get('/by-role/:roleName', ...getUsersByRole);

export default router;
