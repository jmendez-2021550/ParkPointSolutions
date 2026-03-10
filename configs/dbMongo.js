'use strict';

import mongoose from 'mongoose';

//funcion asincrona (de escucha)
export const dbConnection = async () => {
    try {
        mongoose.connection.on('error', (err) => {
            console.error(`MongoDB | Error en la conexión a la db: ${err.message}`);
            mongoose.disconnect(); //se desconecta
        });
        mongoose.connection.on('connecting', () => {            
            console.log(`MongoDB | intentando conectar a mongoDB`);            
        });
        mongoose.connection.on('connected', () => {
            console.log(`MongoDB | conectado a mongoDB`);            
        });
        mongoose.connection.on('open', () => {
            const dbName = mongoose.connection.db?.databaseName || 'unknown';
            console.log(`MongoDB | conectado a la base de datos ${dbName}`);
        });
        mongoose.connection.on('reconnect', () => {
            console.log(`MongoDB | reconectando a mongoDB`);        
        });
        mongoose.connection.on('disconnected', () => {
            console.log(`MongoDB | desconectado de mongoDB`);            
        });
        //conexion

        const defaultUri = 'mongodb://localhost:27017/Parqueo_Inteligente';
        const uri = process.env.URI_MONGO || defaultUri;
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000, //tiempo de espera para la conexion
            maxPoolSize: 10, //numero maximo de conexiones en el pool
        })

        // Ensure essential collections exist so the database appears in MongoDB UI
        try {
            const db = mongoose.connection.db;
            const existing = await db.listCollections().toArray();
            const names = existing.map((c) => c.name);

            const required = ['parking_spots', 'reservations', 'users'];
            for (const col of required) {
                if (!names.includes(col)) {
                    await db.createCollection(col);
                    console.log(`MongoDB | created collection: ${col}`);
                }
            }
            // Remove legacy 'opinions' collection if present
            if (names.includes('opinions')) {
                try {
                    await db.dropCollection('opinions');
                    console.log('MongoDB | dropped legacy collection: opinions');
                } catch (dropErr) {
                    console.warn('MongoDB | could not drop legacy collection opinions:', dropErr.message);
                }
            }
        } catch (collError) {
            console.warn('MongoDB | could not ensure collections exist:', collError.message);
        }
            
    } catch (error) {
        console.log(`Error al conectar la db: ${error}`);

    }
}


//fucnion cuando se apague el servidor (que la bse de datos nunca se qede abierta
//recibe la señal
const gracefulShutdown = async (signal) => {
    console.log(`MongoDB | Received ${signal}. Closing databse connection...`)
    try{
        //se asegura que realmente se cierre la conexion a la base de datos antes de salir del proceso
        await mongoose.connection.close();
        process.exit(0);
    }catch(error){
        console.error(`MongoDB | Error during graceful shutdown:`, error.message);
        process.exit(1);
    }
}
//escucha las señales de terminacion del proceso
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
//reinicios
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2'));