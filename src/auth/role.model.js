import { DataTypes } from 'sequelize';
import { sequelize } from '../../configs/db.js';

import { generateUserId } from '../../helpers/uuid-generator.js';
import { User } from '../users/user.model.js';
import { ALLOWED_ROLES } from '../../helpers/role-constants.js';