import { Role } from '../src/auth/role.model.js';
import { ALLOWED_ROLES, SUPER_ADMIN_ROLE, DEFAULT_SUPER_ADMIN_EMAIL } from './role-constants.js';
import { findUserByEmail } from './user-db.js';
import { setUserSingleRole } from './role-db.js';
import { sequelize } from '../configs/db.js';

export const seedRoles = async () => {
  // create all allowed role records
  for (const name of ALLOWED_ROLES) {
    await Role.findOrCreate({
      where: { Name: name },
      defaults: { Name: name },
    });
  }

  // if the super admin user already exists, assign the role; otherwise create it
  try {
    let superUser = await findUserByEmail(DEFAULT_SUPER_ADMIN_EMAIL);
    if (!superUser) {
      console.log('RoleSeeder: super admin not found, creating default account');
      try {
        const { createNewUser } = await import('./user-db.js');
        const defaultPassword = process.env.SUPER_ADMIN_PASSWORD || 'SuperSecret123!';
        const username = DEFAULT_SUPER_ADMIN_EMAIL.split('@')[0];
        // use dummy phone satisfying validation (8 digits numeric)
        superUser = await createNewUser({
          name: 'Super',
          surname: 'Admin',
          username,
          email: DEFAULT_SUPER_ADMIN_EMAIL,
          password: defaultPassword,
          phone: '00000000',
          profilePicture: null,
        });
        // mark as verified and active
        await superUser.update({ Status: true });
        await superUser.UserEmail.update({ EmailVerified: true });
        console.log('RoleSeeder: default super admin account created with email', DEFAULT_SUPER_ADMIN_EMAIL);
      } catch (createErr) {
        console.error('RoleSeeder: error creando usuario:', createErr.message);
        // if creation fails, we won't have superUser; but continue so server doesn't crash
      }
    }

    if (superUser) {
      await setUserSingleRole(superUser, SUPER_ADMIN_ROLE, sequelize);
      console.log(`RoleSeeder: assigned ${SUPER_ADMIN_ROLE} to user ${DEFAULT_SUPER_ADMIN_EMAIL}`);
    }
  } catch (err) {
    console.error('RoleSeeder: error assigning super admin role to default user', err.message);
  }
};
