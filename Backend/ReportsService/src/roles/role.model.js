import { DataTypes } from 'sequelize';
import { sequelize } from '../../configs/db.js';
import { generateShortUUID } from '../../helpers/uuid-generator.js';

export const Role = sequelize.define(
  'Role',
  {
    Id: { type: DataTypes.STRING(16), primaryKey: true, field: 'id', defaultValue: () => generateShortUUID() },
    Name: { type: DataTypes.STRING(50), allowNull: false, unique: true, field: 'name' },
    CreatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'created_at' },
    UpdatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'updated_at' },
  },
  { tableName: 'roles', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
);

export const UserRole = sequelize.define(
  'UserRole',
  {
    Id: { type: DataTypes.STRING(16), primaryKey: true, field: 'id', defaultValue: () => generateShortUUID() },
    UserId: { type: DataTypes.STRING(16), allowNull: false, field: 'user_id' },
    RoleId: { type: DataTypes.STRING(16), allowNull: false, field: 'role_id' },
    CreatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'created_at' },
    UpdatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'updated_at' },
  },
  { tableName: 'user_roles', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
);

UserRole.belongsTo(Role, { foreignKey: 'role_id', as: 'Role' });
Role.hasMany(UserRole, { foreignKey: 'role_id', as: 'UserRoles' });
