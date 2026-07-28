import { Sequelize } from 'sequelize';
import { config } from './config.js';

export const sequelize = new Sequelize({
  dialect: config.db.dialect,
  host: config.db.host,
  port: config.db.port,
  database: config.db.database,
  username: config.db.username,
  password: config.db.password,
  logging: config.db.logging ? console.log : false,
  define: {
    freezeTableName: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
  },
  pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
});

export const dbConnection = async () => {
  try {
    console.log('PostgreSQL | Trying to connect...');
    await sequelize.authenticate();
    console.log('PostgreSQL | Connected to PostgreSQL');
    if (config.nodeEnv === 'development') {
      const syncLogging = config.db.logging ? console.log : false;
      // Only alter the table this service truly owns (favorites).
      // users/reservations are owned by AuthService/ParkingService — altering them
      // here too causes concurrent-DDL races across services sharing this DB.
      const { Favorite } = await import('../src/favorites/favorite.model.js');
      const { Reservation } = await import('../src/reservations/reservation.model.js');
      const { User } = await import('../src/users/user.model.js');
      await Favorite.sync({ alter: true, logging: syncLogging });
      await Reservation.sync({ logging: syncLogging });
      await User.sync({ logging: syncLogging });
      console.log('PostgreSQL | Models synced (owned tables altered)');
    }
  } catch (error) {
    console.error('PostgreSQL | Could not connect:', error.message);
    process.exit(1);
  }
};

process.on('SIGINT', async () => { await sequelize.close(); process.exit(0); });
process.on('SIGTERM', async () => { await sequelize.close(); process.exit(0); });
