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
      // This service only reads parking_spots/reservations/favorites — it owns no
      // table. Never alter shared tables here: other services already own and
      // alter them, and concurrent ALTERs on the same DB cause relcache races.
      await sequelize.sync({ logging: config.db.logging ? console.log : false });
      console.log('PostgreSQL | Models synced (no alter — read-only consumer)');
    }
  } catch (error) {
    console.error('PostgreSQL | Could not connect:', error.message);
    process.exit(1);
  }
};

process.on('SIGINT', async () => { await sequelize.close(); process.exit(0); });
process.on('SIGTERM', async () => { await sequelize.close(); process.exit(0); });
