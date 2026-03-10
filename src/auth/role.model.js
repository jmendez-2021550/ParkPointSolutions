import { DataTypes } from 'sequelize';
import { sequelize } from '../../configs/db.js';

import { generateUserId } from '../../helpers/uuid-generator.js';
import { User } from '../users/user.model.js';
import { ALLOWED_ROLES } from '../../helpers/role-constants.js';

export const Role = sequelize.define(
    'Role',
    {
        Id: {
            type: DataTypes.STRING(16),
            primaryKey: true,
            field: 'id',
            defaultValue: () => generateUserId(),
        },
        Name: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
            field: 'name',
            validate: {
                notEmpty: { msg: 'El nombre del rol es obligatorio.' },
                isIn: {
                    args: [ALLOWED_ROLES],
                    msg: 'Rol no permitido. Use ADMIN_ROLE o USER_ROLE.',
                },
            },
        },