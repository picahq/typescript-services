import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { getAllMigrations, Migrated } from '.';
import { createIndexes } from '../indexGenerator';

async function main() {
  dotenv.config();

  const runState = process.env.RUN_STATE || 'before'; // before, after
  const dbUri = process.env.MONGO_URI;
  const dbName = process.env.MONGO_DB_NAME;

  // Connect to DB
  const client = await MongoClient.connect(dbUri);
  const db = client.db(dbName);
  console.log(`Connected to DB ${dbName}.`);

  // Index code
  console.log('Running Index Generator...');
  await createIndexes(db);
  console.log('✅ Index Generator complete.');

  // Migration code
  console.log(`Running migration...`);

  if (runState === 'before') {
    console.log(`Running before migration...`);
  } else if (runState === 'after') {
    console.log(`Running after migration...`);
  }

  console.log(`✅ All migrations completed.`);

  client.close();
}

main().then().catch(console.error);
