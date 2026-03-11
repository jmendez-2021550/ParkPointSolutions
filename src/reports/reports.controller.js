import PDFDocument from 'pdfkit';
import { Reservation, ParkingSpot } from '../parking/parking.model.js';
import { sequelize } from '../../configs/db.js';
import { getUserRoleNames } from '../../helpers/role-db.js';
import { SUPER_ADMIN_ROLE } from '../../helpers/role-constants.js';
import { sendReportEmail } from '../../helpers/email-service.js';

// helper que revisa si el usuario actual es superadmin
const ensureSuperAdmin = async (req) => {
  const currentUserId = req.userId;
  if (!currentUserId) return false;
  const roles =
    req.user?.UserRoles?.map((ur) => ur.Role?.Name).filter(Boolean) ??
    (await getUserRoleNames(currentUserId));
  return roles.includes(SUPER_ADMIN_ROLE);
};
