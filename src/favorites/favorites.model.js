import { DataTypes } from 'sequelize';
import { sequelize } from '../../configs/db.js';

export const Favorite = sequelize.define(
    'Favorite',
    {
        Id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'id',
        },
        UserId: {
            type: DataTypes.STRING(16),
            allowNull: false,
            field: 'user_id',
            references: {
                model: 'users',
                key: 'id',
            },
        },
        IsActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            allowNull: false,
            field: 'is_active',
        },
        CreatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: 'created_at',
        },
        UpdatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: 'updated_at',
        },
    },
    {
        tableName: 'favorites',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);

// Asociación con User (solo belongsTo para evitar problemas circulares)
import { User } from '../users/user.model.js';
Favorite.belongsTo(User, { foreignKey: 'UserId', as: 'User' });