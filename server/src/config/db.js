import mongoose from 'mongoose';

/**
 * Strips sensitive credentials from a MongoDB connection string for safe logging.
 * @param {string} uri - MongoDB connection string
 * @returns {string} Sanitized connection string safe for console logs
 */
const sanitizeMongoUri = (uri) => {
  if (!uri) return '[empty]';
  return uri.replace(/\/\/(.*?)@/, '//***:***@');
};

/**
 * Establishes connection to MongoDB Atlas / local MongoDB instance.
 * Exits the process if initial connection fails to prevent headless instability.
 *
 * @returns {Promise<typeof mongoose>} Mongoose instance
 */
export const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error('FATAL ERROR: MONGODB_URI environment variable is not defined.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    const host = conn.connection.host;
    const name = conn.connection.name;
    console.log(`[Database] MongoDB Connected successfully: ${host}/${name}`);

    // Connection lifecycle monitoring
    mongoose.connection.on('error', (err) => {
      console.error(`[Database] Runtime MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[Database] MongoDB connection lost. Attempting reconnection...');
    });

    return conn;
  } catch (error) {
    console.error(
      `[Database] Initial MongoDB connection failed to ${sanitizeMongoUri(mongoUri)}: ${error.message}`
    );
    // Terminate process on startup failure as specified
    process.exit(1);
  }
};

export default connectDB;
