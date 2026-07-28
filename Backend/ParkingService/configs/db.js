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
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

export const dbConnection = async () => {
  try {
    console.log('PostgreSQL | Trying to connect...');
    await sequelize.authenticate();
    console.log('PostgreSQL | Connected to PostgreSQL');
    if (config.nodeEnv === 'development') {
      const syncLogging = config.db.logging ? console.log : false;
      // Only alter tables this service truly owns (parking_spots, reservations).
      // users/favorites are owned by AuthService/FavoritesService — altering them
      // here too causes concurrent-DDL races across services sharing this DB.
      const { ParkingSpot, Reservation } = await import('../src/parking/parking.model.js');
      const { User } = await import('../src/users/user.model.js');
      const { Favorite } = await import('../src/favorites/favorite.model.js');
      await ParkingSpot.sync({ alter: true, logging: syncLogging });
      await Reservation.sync({ alter: true, logging: syncLogging });
      await User.sync({ logging: syncLogging });
      await Favorite.sync({ logging: syncLogging });
      console.log('PostgreSQL | Models synced (owned tables altered)');
    }
  } catch (error) {
    console.error('PostgreSQL | Could not connect to PostgreSQL');
    console.error('PostgreSQL | Error:', error.message);
    process.exit(1);
  }
};

const gracefulShutdown = async (signal) => {
  console.log(`PostgreSQL | Received ${signal}. Closing database connection...`);
  try {
    await sequelize.close();
    console.log('PostgreSQL | Database connection closed successfully');
    process.exit(0);
  } catch (error) {
    console.error('PostgreSQL | Error during graceful shutdown:', error.message);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2'));
