import { Sequelize } from 'sequelize';
import { config } from './config.js';

export const sequelize = new Sequelize({
  dialect: 'postgres',
  host: config.db.host,
  port: config.db.port,
  database: config.db.name,
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

const seedRoles = async () => {
  // Import here (after sync) to avoid circular dependency at module load
  const { Role } = await import('../src/auth/role.model.js');
  const roles = ['USER_ROLE', 'ADMIN_ROLE', 'SUPER_ADMIN_ROLE'];
  for (const name of roles) {
    await Role.findOrCreate({ where: { Name: name }, defaults: { Name: name } });
  }
  console.log('Auth Service | Roles seeded: USER_ROLE, ADMIN_ROLE, SUPER_ADMIN_ROLE');
};

export const dbConnection = async () => {
  try {
    await sequelize.authenticate();
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      await seedRoles();
      const { seedSuperAdmin } = await import('../helpers/seed-super-admin.js');
      await seedSuperAdmin();
    }
    console.log('Auth Service | PostgreSQL connected');
  } catch (error) {
    console.error('Auth Service | DB connection failed', error);
    process.exit(1);
  }
};
