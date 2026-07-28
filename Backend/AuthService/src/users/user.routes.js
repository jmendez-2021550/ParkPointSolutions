import { Router } from 'express';
import {
  getAllUsers,
  updateUserRole,
  getUserRoles,
  getUsersByRole,
  deleteUser,
} from './user.controller.js';

const router = Router();

router.get('/', getAllUsers);
router.put('/:userId/role', ...updateUserRole);
router.get('/:userId/roles', ...getUserRoles);
router.delete('/:userId', ...deleteUser);
router.get('/by-role/:roleName', ...getUsersByRole);

export default router;
