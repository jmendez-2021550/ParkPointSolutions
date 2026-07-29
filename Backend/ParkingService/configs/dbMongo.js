import mongoose from 'mongoose';
import { config } from './config.js';

// Oculta usuario/password al imprimir la URI en consola.
const maskUri = (uri) => uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');

export const dbMongoConnection = async () => {
  try {
    const uri = config.mongo.uri;
    // Atlas se puede usar con la cadena SRV o con la estandar (varios nodos).
    const isAtlas = uri.startsWith('mongodb+srv://') || uri.includes('mongodb.net');

    console.log(`MongoDB | Connecting to ${maskUri(uri)} (${isAtlas ? 'Atlas' : 'local'})`);

    await mongoose.connect(uri, {
      dbName: config.mongo.dbName,
      serverSelectionTimeoutMS: 15000,
      retryWrites: true,
    });

    console.log(`MongoDB | Connected successfully to database "${mongoose.connection.name}"`);

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB | Connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB | Disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB | Reconnected');
    });
  } catch (error) {
    console.error('MongoDB | Could not connect to MongoDB');
    console.error(error.message);
    process.exit(1);
  }
};

process.on('SIGINT', async () => {
  await mongoose.disconnect();
  process.exit(0);
});
