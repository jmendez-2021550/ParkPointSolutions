import { DataTypes } from 'sequelize';
import { sequelize } from '../../configs/db.js';
import { generateShortUUID } from '../../helpers/uuid-generator.js';

export const Reservation = sequelize.define(
  'Reservation',
  {
    Id: { type: DataTypes.STRING(20), primaryKey: true, field: 'id', defaultValue: () => `rs_${generateShortUUID()}` },
    UserId: { type: DataTypes.STRING(16), allowNull: false, field: 'user_id' },
    ParkingSpotId: { type: DataTypes.STRING(20), allowNull: false, field: 'parking_spot_id' },
    StartAt: { type: DataTypes.DATE, allowNull: false, field: 'start_at' },
    EndAt: { type: DataTypes.DATE, allowNull: false, field: 'end_at' },
    Status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'reserved', field: 'status' },
    PriceCents: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'price_cents' },
    PaymentIntentId: { type: DataTypes.STRING(128), allowNull: true, field: 'payment_intent_id' },
    CreatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'created_at' },
    UpdatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'updated_at' },
  },
  { tableName: 'reservations', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
);
