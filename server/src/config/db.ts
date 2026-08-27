import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoMemoryServer: MongoMemoryServer | null = null;

export async function connectDB() {
  try {
    if (mongoose.connection.readyState !== 0) {
      return;
    }

    let mongoUri = process.env.MONGO_URI;

    // Check if we should use an in-memory database as fallback
    // We will try to connect to the configured MONGO_URI first. If it is local and fails, we spin up the memory server.
    const isLocal = !mongoUri || mongoUri.includes('127.0.0.1') || mongoUri.includes('localhost');
    
    if (isLocal) {
      try {
        console.log('🔌 Checking local MongoDB server on port 27017...');
        // Test connection with a short 2-second timeout
        const testUri = mongoUri || 'mongodb://127.0.0.1:27017/recoverai';
        await mongoose.connect(testUri, { serverSelectionTimeoutMS: 2000 });
        console.log('✅ Connected to existing local MongoDB server.');
        return;
      } catch (err) {
        console.log('⚠️ Local MongoDB is not running. Starting in-memory MongoDB fallback...');
        mongoMemoryServer = await MongoMemoryServer.create();
        mongoUri = mongoMemoryServer.getUri();
        console.log(`🚀 In-memory MongoDB running at: ${mongoUri}`);
      }
    }

    if (!mongoUri) {
      mongoUri = 'mongodb://127.0.0.1:27017/recoverai';
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB successfully.');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

export async function disconnectDB() {
  try {
    await mongoose.disconnect();
    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
    }
  } catch (error) {
    console.error('Error during DB disconnect:', error);
  }
}
