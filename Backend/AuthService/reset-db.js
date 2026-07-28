/**
 * Script de limpieza y reinicio (ejecutar UNA sola vez).
 * Elimina usuarios sin rol asignado y siembra los roles del sistema.
 * Uso: node reset-db.js
 */
import { Sequelize, DataTypes, Op } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

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
    console.log('✅ Conectado a PostgreSQL');

    // ── 1. Seed roles ─────────────────────────────────────────
    const [rolesInserted] = await sequelize.query(`
      INSERT INTO roles (id, name, created_at, updated_at)
      VALUES
        (substr(md5(random()::text), 1, 16), 'USER_ROLE',        NOW(), NOW()),
        (substr(md5(random()::text), 1, 16), 'ADMIN_ROLE',       NOW(), NOW()),
        (substr(md5(random()::text), 1, 16), 'SUPER_ADMIN_ROLE', NOW(), NOW())
      ON CONFLICT (name) DO NOTHING
      RETURNING name;
    `);
    console.log('✅ Roles sembrados:', rolesInserted.length > 0 ? rolesInserted.map(r => r.name).join(', ') : 'ya existían');

    // ── 2. Mostrar usuarios actuales ──────────────────────────
    const [users] = await sequelize.query('SELECT id, username, email FROM users ORDER BY created_at;');
    console.log(`\n📋 Usuarios en la BD: ${users.length}`);
    users.forEach(u => console.log(`   - ${u.email} (${u.username})`));

    // ── 3. Borrar usuarios SIN rol asignado ───────────────────
    const [withRole] = await sequelize.query('SELECT DISTINCT user_id FROM user_roles;');
    const withRoleIds = withRole.map(r => r.user_id);

    const usersToDelete = users.filter(u => !withRoleIds.includes(u.id));
    if (usersToDelete.length > 0) {
      console.log(`\n🗑️  Eliminando ${usersToDelete.length} usuario(s) sin rol:`);
      for (const u of usersToDelete) {
        console.log(`   - ${u.email}`);
        await sequelize.query(`DELETE FROM user_password_resets WHERE user_id = '${u.id}';`);
        await sequelize.query(`DELETE FROM user_emails        WHERE user_id = '${u.id}';`);
        await sequelize.query(`DELETE FROM user_profiles      WHERE user_id = '${u.id}';`);
        await sequelize.query(`DELETE FROM user_roles         WHERE user_id = '${u.id}';`);
        await sequelize.query(`DELETE FROM users              WHERE id      = '${u.id}';`);
      }
      console.log('✅ Usuarios sin rol eliminados');
    } else {
      console.log('\n✅ No hay usuarios sin rol — nada que limpiar');
    }

    // ── 4. Borrar TODOS los usuarios (para forzar registro limpio) ──
    // Descomenta si quieres empezar completamente desde cero:
    /*
    console.log('\n🔥 Borrando TODOS los usuarios...');
    await sequelize.query('DELETE FROM user_password_resets;');
    await sequelize.query('DELETE FROM user_emails;');
    await sequelize.query('DELETE FROM user_profiles;');
    await sequelize.query('DELETE FROM user_roles;');
    await sequelize.query('DELETE FROM users;');
    console.log('✅ Todos los usuarios eliminados. Ahora puedes registrarte de nuevo.');
    */

    console.log('\n🎉 Listo. Ahora reinicia el AuthService y registra tu cuenta.');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await sequelize.close();
  }
};

run();
