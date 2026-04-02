import mongoose from 'mongoose';
import Apod from '../modules/apod/apod.model.js';
/**
 * Connect to MongoDB or start Memory Server
 * @returns {Promise<boolean>} Success status
 */
export async function connectDB() {
    let mongoUri = process.env.MONGODB_URI;
    let useMongoDB = false;
    try {
        if (process.env.USE_MEMORY_SERVER !== 'false' && !mongoUri) {
            console.log('[MongoDB] Starting in-memory MongoDB...');
            const { MongoMemoryServer } = await import('mongodb-memory-server');
            const mongod = await MongoMemoryServer.create();
            mongoUri = mongod.getUri();
            console.log(`[MongoDB] Memory server started at: ${mongoUri}`);
        }
        if (mongoUri) {
            await mongoose.connect(mongoUri);
            console.log('[MongoDB] Connected successfully');
            useMongoDB = true;
            try {
                await Apod.collection.createIndex({ title: 'text', explanation: 'text' });
                console.log('[MongoDB] Text index created');
            }
            catch (e) { }
        }
        return useMongoDB;
    }
    catch (err) {
        console.error('[MongoDB] Connection failed:', err.message);
        return false;
    }
}
export default connectDB;
