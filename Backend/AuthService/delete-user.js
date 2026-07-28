/**
 * Elimina un usuario específico por email y todos sus registros relacionados.
 * Uso: node delete-user.js <email>
 * Ejemplo: node delete-user.js jmendez-2021550@kinal.edu.gt
 */
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const email = process.argv[2];
if (!email) {
  console.error('❌ Uso: node delete-user.js <email>');
  console.error('   Ejemplo: node delete-user.js jmendez-2021550@kinal.edu.gt');
  process.exit(1);
}

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

    const [[user]] = await sequelize.query(
      `SELECT id, username, email FROM users WHERE LOWER(email) = LOWER('${email}') LIMIT 1;`
    );

    if (!user) {
      console.log(`⚠️  No existe ningún usuario con email: ${email}`);
      console.log('   Ya puedes registrar ese email libremente.');
      return;
    }

    console.log(`\n🔍 Usuario encontrado:`);
    console.log(`   ID:       ${user.id}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Email:    ${user.email}`);

    const id = user.id;
    await sequelize.query(`DELETE FROM user_password_resets WHERE user_id = '${id}';`);
    await sequelize.query(`DELETE FROM user_emails        WHERE user_id = '${id}';`);
    await sequelize.query(`DELETE FROM user_profiles      WHERE user_id = '${id}';`);
    await sequelize.query(`DELETE FROM user_roles         WHERE user_id = '${id}';`);
    await sequelize.query(`DELETE FROM users              WHERE id      = '${id}';`);

    console.log(`\n✅ Usuario ${email} eliminado correctamente.`);
    console.log('   Ahora puedes registrar ese email en la aplicación.');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await sequelize.close();
  }
};

run();
