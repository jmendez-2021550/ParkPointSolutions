/**
 * Verifica y repara el rol del super admin.
 * Si el usuario existe con rol incorrecto → lo corrige a SUPER_ADMIN_ROLE.
 * Si no existe → muestra instrucciones de registro.
 * Uso: node fix-superadmin.js
 */
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const SUPER_ADMIN_EMAIL = 'jmendez-2021550@kinal.edu.gt';

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5436,
  database: process.env.DB_NAME,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  logging: false,
});

const run = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado a PostgreSQL\n');

    // 1. Verify roles exist
    const [roles] = await sequelize.query(`SELECT id, name FROM roles ORDER BY name;`);
    console.log(`📋 Roles en la BD: ${roles.map(r => r.name).join(', ')}`);

    const superAdminRole = roles.find(r => r.name === 'SUPER_ADMIN_ROLE');
    if (!superAdminRole) {
      console.log('\n❌ SUPER_ADMIN_ROLE no existe. Corriendo seed...');
      for (const name of ['USER_ROLE', 'ADMIN_ROLE', 'SUPER_ADMIN_ROLE']) {
        await sequelize.query(`
          INSERT INTO roles (id, name, created_at, updated_at)
          VALUES (substr(md5(random()::text), 1, 16), '${name}', NOW(), NOW())
          ON CONFLICT (name) DO NOTHING;
        `);
      }
      const [newRoles] = await sequelize.query(`SELECT id, name FROM roles ORDER BY name;`);
      const saRole = newRoles.find(r => r.name === 'SUPER_ADMIN_ROLE');
      console.log(`✅ Roles sembrados. SUPER_ADMIN_ROLE id: ${saRole?.id}`);
    }

    // 2. Find the super admin user
    const [[user]] = await sequelize.query(
      `SELECT id, username, email FROM users WHERE LOWER(email) = LOWER('${SUPER_ADMIN_EMAIL}') LIMIT 1;`
    );

    if (!user) {
      console.log(`\n⚠️  El usuario ${SUPER_ADMIN_EMAIL} NO existe en la BD.`);
      console.log('   → Ve a /register y regístralo con ese email.');
      console.log('   → El backend asignará SUPER_ADMIN_ROLE automáticamente.');
      return;
    }

    console.log(`\n👤 Usuario encontrado:`);
    console.log(`   ID:       ${user.id}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Email:    ${user.email}`);

    // 3. Check current role
    const [currentRoles] = await sequelize.query(`
      SELECT r.name FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = '${user.id}';
    `);
    console.log(`\n🔑 Rol actual: ${currentRoles.map(r => r.name).join(', ') || '(ninguno)'}`);

    const hasSuperAdmin = currentRoles.some(r => r.name === 'SUPER_ADMIN_ROLE');

    if (hasSuperAdmin) {
      console.log('\n✅ El usuario ya tiene SUPER_ADMIN_ROLE correctamente.');
      console.log('   Puedes iniciar sesión en /login con ese email.');
    } else {
      console.log('\n🔧 Corrigiendo rol a SUPER_ADMIN_ROLE...');

      // Get SUPER_ADMIN_ROLE id
      const [[saRoleRow]] = await sequelize.query(`SELECT id FROM roles WHERE name = 'SUPER_ADMIN_ROLE' LIMIT 1;`);
      if (!saRoleRow) { console.error('❌ SUPER_ADMIN_ROLE no encontrado'); return; }

      // Replace role
      await sequelize.query(`DELETE FROM user_roles WHERE user_id = '${user.id}';`);
      await sequelize.query(`
        INSERT INTO user_roles (id, user_id, role_id, created_at, updated_at)
        VALUES (substr(md5(random()::text), 1, 16), '${user.id}', '${saRoleRow.id}', NOW(), NOW());
      `);

      // Also make sure the user status is active
      await sequelize.query(`UPDATE users SET status = true WHERE id = '${user.id}';`);
      await sequelize.query(`UPDATE user_emails SET email_verified = true WHERE user_id = '${user.id}';`);

      console.log('✅ Rol actualizado a SUPER_ADMIN_ROLE');
      console.log('✅ Cuenta activada (status = true, email verificado)');
      console.log('\n🎉 Ahora puedes iniciar sesión con ese email en /login.');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await sequelize.close();
  }
};

run();
