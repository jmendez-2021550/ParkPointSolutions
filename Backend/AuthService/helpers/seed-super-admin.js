import { User, UserProfile, UserEmail, UserPasswordReset } from '../src/users/user.model.js';
import { Role, UserRole } from '../src/auth/role.model.js';
import { hashPassword } from '../utils/password-utils.js';
import { DEFAULT_SUPER_ADMIN_EMAIL, SUPER_ADMIN_ROLE } from './role-constants.js';

const SUPER_ADMIN_USERNAME = 'superadmin';
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_SEED_PASSWORD || 'SuperAdmin1220';

export const seedSuperAdmin = async () => {
  const existing = await User.findOne({ where: { Email: DEFAULT_SUPER_ADMIN_EMAIL.toLowerCase() } });

  const superAdminRole = await Role.findOne({ where: { Name: SUPER_ADMIN_ROLE } });
  if (!superAdminRole) {
    console.warn('Auth Service | SUPER_ADMIN_ROLE no encontrado, no se pudo sembrar el super admin');
    return;
  }

  if (existing) {
    const hashedPassword = await hashPassword(SUPER_ADMIN_PASSWORD);
    await User.update(
      { Status: true, Password: hashedPassword },
      { where: { Id: existing.Id } }
    );
    await UserEmail.update(
      { EmailVerified: true },
      { where: { UserId: existing.Id } }
    );

    const hasSuperAdminRole = await UserRole.findOne({
      where: { UserId: existing.Id, RoleId: superAdminRole.Id },
    });
    if (!hasSuperAdminRole) {
      await UserRole.destroy({ where: { UserId: existing.Id } });
      await UserRole.create({ UserId: existing.Id, RoleId: superAdminRole.Id });
    }

    console.log('Auth Service | ════════════════════════════════════════');
    console.log(`Auth Service | Super admin verificado: ${DEFAULT_SUPER_ADMIN_EMAIL}`);
    console.log(`Auth Service |   Password: ${SUPER_ADMIN_PASSWORD}`);
    console.log('Auth Service | ════════════════════════════════════════');
    return;
  }

  const transaction = await User.sequelize.transaction();
  try {
    const hashedPassword = await hashPassword(SUPER_ADMIN_PASSWORD);
    const user = await User.create(
      {
        Name: 'Super',
        Surname: 'Admin',
        Username: SUPER_ADMIN_USERNAME,
        Email: DEFAULT_SUPER_ADMIN_EMAIL.toLowerCase(),
        Password: hashedPassword,
        Status: true,
      },
      { transaction }
    );

    await UserProfile.create(
      { UserId: user.Id, Phone: '00000000', ProfilePicture: '' },
      { transaction }
    );

    await UserEmail.create(
      { UserId: user.Id, EmailVerified: true },
      { transaction }
    );

    await UserPasswordReset.create({ UserId: user.Id }, { transaction });

    await UserRole.create({ UserId: user.Id, RoleId: superAdminRole.Id }, { transaction });

    await transaction.commit();

    console.log('Auth Service | ════════════════════════════════════════');
    console.log('Auth Service | Super admin creado automáticamente');
    console.log(`Auth Service |   Email:    ${DEFAULT_SUPER_ADMIN_EMAIL}`);
    console.log(`Auth Service |   Username: ${SUPER_ADMIN_USERNAME}`);
    console.log(`Auth Service |   Password: ${SUPER_ADMIN_PASSWORD}`);
    console.log('Auth Service | ════════════════════════════════════════');
  } catch (error) {
    await transaction.rollback();
    console.error('Auth Service | Error al sembrar el super admin:', error.message);
  }
};
