// helpers/parking-seed.js
import { ParkingSpot } from '../src/parking/parking.model.js';

export const seedParkingSpots = async () => {
  try {
    // Limpiar registros antiguos (solo los primeros 8 si existen más de 30, para migrar data)
    const count = await ParkingSpot.count();
    if (count > 0 && count !== 30) {
      console.log(`Parking | Cleaning old spots data (${count} spots found, expected 30)...`);
      await ParkingSpot.destroy({ where: {} });
      console.log('Parking | Old spots data cleared');
    } else if (count === 30) {
      console.log('Parking | Parking spots data already exists and correct, skipping seed');
      return;
    }

    // Generar spots A1 a A30
    const spotsData = [];
    for (let i = 1; i <= 30; i++) {
      spotsData.push({
        Code: `A${i}`,
        Level: '1',
        Status: 'available',
        SensorType: 'ultrasonic',
      });
    }

    await ParkingSpot.bulkCreate(spotsData);
    console.log(`Parking | Seeded ${spotsData.length} parking spots successfully`);
  } catch (error) {
    console.error('Parking | Error seeding parking spots:', error.message);
  }
};
