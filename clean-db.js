import dotenv from 'dotenv';
import { sequelize } from './configs/db.js';
import './src/users/user.model.js';
import './src/parking/parking.model.js';

dotenv.config();

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado a PostgreSQL');

    // Borrar todos los registros de relaciones y datos
    await sequelize.query('DELETE FROM reservations');
    console.log('✅ Reservas eliminadas');
    
    await sequelize.query('DELETE FROM parking_spots');
    console.log('✅ Espacios de estacionamiento eliminados');
    
    await sequelize.query('DELETE FROM user_roles');
    console.log('✅ Roles de usuarios eliminados');
    
    await sequelize.query('DELETE FROM users');
    console.log('✅ Usuarios eliminados correctamente');

    console.log('✅ Base de datos limpia. Reinicia el servidor para hacer seed nuevamente.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();