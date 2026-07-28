import mongoose from 'mongoose';
import { config } from './config.js';

export const dbMongoConnection = async () => {
  try {
    const uri = config.mongo.uri;
    console.log('MongoDB | Connecting to', uri);
    await mongoose.connect(uri);

    mongoose.connection.on('connected', () => {
      console.log('MongoDB | Connected successfully');
    });

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB | Connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB | Disconnected');
    });
  } catch (error) {
    console.error('MongoDB | Could not connect to MongoDB');
    console.error(error);
    process.exit(1);
  }
};

process.on('SIGINT', async () => {
  await mongoose.disconnect();
  process.exit(0);
});
