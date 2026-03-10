import { DataTypes } from 'sequelize';
import { sequelize } from '../../configs/db.js';
import User from '../users/user.model.js';
import { generateShortUUID } from '../../helpers/uuid-generator.js';

export const ParkingSpot = sequelize.define(
    'ParkingSpot',
    {
        Id: {
            type: DataTypes.STRING(20),
            primaryKey: true,
            field: 'id',
            defaultValue: () => `ps_${generateShortUUID()}`,
        },
        Code: {
            type: DataTypes.STRING(32),
            allowNull: false,
            unique: true,
            field: 'code',
        },
        Level: { type: DataTypes.STRING(10), allowNull: true, field: 'level' },
        Status: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: 'available',
            field: 'status',
        },
        SensorType: { type: DataTypes.STRING(50), allowNull: true, field: 'sensor_type' },
        LastSeenAt: { type: DataTypes.DATE, allowNull: true, field: 'last_seen_at' },
        CreatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'created_at' },
        UpdatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'updated_at' },
    },
    {
        tableName: 'parking_spots',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);