/**
 * Migra las colecciones de Mongo local (Docker) hacia MongoDB Atlas.
 *
 * Uso:
 *   node scripts/migrate-to-atlas.js
 *
 * Variables necesarias (en el .env del ParkingService):
 *   MONGODB_SOURCE_URI  -> origen. Default: mongodb://[::1]:27017/Parqueo_Inteligente
 *                          OJO: se usa [::1] y no localhost porque en esta maquina
 *                          convive un mongod nativo de Windows en 127.0.0.1:27017
 *                          que esta vacio. El contenedor Docker responde por IPv6.
 *   MONGODB_URI         -> destino Atlas (mongodb+srv://...)
 *
 * Es idempotente: usa upsert por _id, se puede correr varias veces sin duplicar.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const SOURCE_URI = process.env.MONGODB_SOURCE_URI || 'mongodb://[::1]:27017/Parqueo_Inteligente';
const TARGET_URI = process.env.MONGODB_URI || process.env.URI_MONGO;
const DB_NAME = process.env.MONGODB_DB_NAME || 'Parqueo_Inteligente';

const maskUri = (uri) => uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');

const run = async () => {
  if (!TARGET_URI) {
    console.error('ERROR: falta MONGODB_URI (la cadena de conexion de Atlas) en el .env');
    process.exit(1);
  }

  if (!TARGET_URI.startsWith('mongodb+srv://') && !TARGET_URI.includes('mongodb.net')) {
    console.error('ERROR: MONGODB_URI no parece ser de Atlas. Se esperaba mongodb+srv://...');
    process.exit(1);
  }

  console.log('Origen :', maskUri(SOURCE_URI));
  console.log('Destino:', maskUri(TARGET_URI));

  const source = await mongoose.createConnection(SOURCE_URI, {
    serverSelectionTimeoutMS: 10000,
  }).asPromise();

  const target = await mongoose.createConnection(TARGET_URI, {
    dbName: DB_NAME,
    serverSelectionTimeoutMS: 20000,
  }).asPromise();

  const collections = await source.db.listCollections().toArray();
  const names = collections
    .map((c) => c.name)
    .filter((n) => !n.startsWith('system.'));

  // Salvaguarda: si el origen esta vacio probablemente apuntamos al mongod
  // equivocado (el nativo de Windows en 127.0.0.1 en vez del contenedor Docker).
  if (names.length === 0) {
    console.error(
      '\nERROR: el origen no tiene ninguna coleccion. Se aborta para no dar por buena\n' +
        'una migracion vacia. Revisa MONGODB_SOURCE_URI: si en esta maquina hay un\n' +
        'MongoDB nativo escuchando en 127.0.0.1:27017, usa mongodb://[::1]:27017/... '
    );
    await source.close();
    await target.close();
    process.exit(1);
  }

  let totalMigrated = 0;

  for (const name of names) {
    const docs = await source.db.collection(name).find({}).toArray();

    if (docs.length === 0) {
      console.log(`  ${name}: 0 documentos, se omite`);
      continue;
    }

    const ops = docs.map((doc) => ({
      replaceOne: {
        filter: { _id: doc._id },
        replacement: doc,
        upsert: true,
      },
    }));

    const result = await target.db.collection(name).bulkWrite(ops, { ordered: false });
    totalMigrated += docs.length;

    console.log(
      `  ${name}: ${docs.length} documentos -> ` +
        `${result.upsertedCount} insertados, ${result.modifiedCount} actualizados`
    );

    // Replica los indices definidos en el origen (menos el _id_ que Mongo crea solo).
    const indexes = await source.db.collection(name).indexes();
    for (const idx of indexes) {
      if (idx.name === '_id_') continue;
      try {
        const { key, name: idxName, v, ...options } = idx;
        await target.db.collection(name).createIndex(key, { name: idxName, ...options });
      } catch (err) {
        console.warn(`    aviso: no se pudo crear el indice ${idx.name}: ${err.message}`);
      }
    }
  }

  // Verificacion: compara los conteos reales origen vs destino.
  console.log('\nVerificacion:');
  let allMatch = true;

  for (const name of names) {
    const srcCount = await source.db.collection(name).countDocuments();
    const dstCount = await target.db.collection(name).countDocuments();
    const ok = srcCount === dstCount;
    if (!ok) allMatch = false;
    console.log(`  ${ok ? 'OK  ' : 'FALLA'} ${name}: origen ${srcCount} / Atlas ${dstCount}`);
  }

  await source.close();
  await target.close();

  if (!allMatch) {
    console.error('\nLos conteos no coinciden. Revisa los errores de arriba.');
    process.exit(1);
  }

  console.log(`\nMigracion terminada. ${totalMigrated} documentos procesados en Atlas.`);
};

run().catch(async (error) => {
  console.error('Fallo la migracion:', error.message);
  process.exit(1);
});
