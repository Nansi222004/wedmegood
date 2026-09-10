require('dotenv').config();
const mongoose = require('mongoose');

async function migrate() {
  const localUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/wedding';
  let atlasUri = process.env.MONGODB_ATLAS_URI;

  if (!atlasUri) {
    console.error('Error: MONGODB_ATLAS_URI is not defined in .env');
    process.exit(1);
  }

  // Ensure Atlas URI connects to the 'wedding' database
  if (atlasUri.endsWith('.net/')) {
    atlasUri += 'wedding';
  } else if (atlasUri.includes('?')) {
    const parts = atlasUri.split('?');
    if (parts[0].endsWith('/')) {
        atlasUri = parts[0] + 'wedding?' + parts[1];
    }
  }

  console.log(`Local URI: ${localUri}`);
  console.log(`Atlas URI: ${atlasUri.replace(/:([^:@]+)@/, ':<hidden>@')}`);

  let localConnection;
  let atlasConnection;

  try {
    console.log('\nConnecting to local database...');
    localConnection = await mongoose.createConnection(localUri).asPromise();
    console.log('Connected to local database.');

    console.log('\nConnecting to Atlas database...');
    atlasConnection = await mongoose.createConnection(atlasUri).asPromise();
    console.log('Connected to Atlas database.');

    const localDb = localConnection.db;
    const atlasDb = atlasConnection.db;

    const collections = await localDb.listCollections().toArray();

    if (collections.length === 0) {
      console.log('\nNo collections found in local database.');
      return;
    }

    console.log(`\nFound ${collections.length} collections to migrate.`);

    for (const colInfo of collections) {
      const colName = colInfo.name;
      // Skip system collections
      if (colName.startsWith('system.')) continue;

      console.log(`\n--- Processing collection: ${colName} ---`);
      
      const localCollection = localDb.collection(colName);
      const atlasCollection = atlasDb.collection(colName);

      const docs = await localCollection.find({}).toArray();
      console.log(`Found ${docs.length} documents in local '${colName}'.`);
      
      if (docs.length > 0) {
        console.log(`Dropping Atlas collection '${colName}' (if it exists) to ensure a clean migration...`);
        try {
          await atlasCollection.drop();
        } catch (e) {
          // It will throw if the collection does not exist, which is fine
        }
        
        console.log(`Inserting ${docs.length} documents into Atlas '${colName}'...`);
        // Using insertMany with ordered: false to continue on error (though for fresh insert it shouldn't error)
        await atlasCollection.insertMany(docs);
        console.log(`Successfully migrated '${colName}'.`);
      } else {
        console.log(`Skipping empty collection: ${colName}`);
      }
    }
    
    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
  } finally {
    if (localConnection) await localConnection.close();
    if (atlasConnection) await atlasConnection.close();
    process.exit(0);
  }
}

migrate();
