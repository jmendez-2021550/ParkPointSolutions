import { DataTypes } from 'sequelize';
import { sequelize } from '../../configs/db.js';
import { generateShortUUID } from '../../helpers/uuid-generator.js';

export const ParkingSpot = sequelize.define(
  'ParkingSpot',
  {
    Id: { type: DataTypes.STRING(20), primaryKey: true, field: 'id', defaultValue: () => `ps_${generateShortUUID()}` },
    Code: { type: DataTypes.STRING(32), allowNull: false, unique: true, field: 'code' },
    Level: { type: DataTypes.STRING(10), allowNull: true, field: 'level' },
    Status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'available', field: 'status' },
    SensorType: { type: DataTypes.STRING(50), allowNull: true, field: 'sensor_type' },
    LastSeenAt: { type: DataTypes.DATE, allowNull: true, field: 'last_seen_at' },
    CreatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'created_at' },
    UpdatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'updated_at' },
  },
  { tableName: 'parking_spots', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
);

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

ParkingSpot.hasMany(Reservation, { foreignKey: 'parking_spot_id', as: 'Reservations' });
Reservation.belongsTo(ParkingSpot, { foreignKey: 'parking_spot_id', as: 'ParkingSpot' });
