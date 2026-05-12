import mongoose from "mongoose";

const isPlaceholderMongoUri = (mongoURI) => {
  if (!mongoURI) {
    return true;
  }

  return /username:password|<db_password>|your_mongodb_connection_string|cluster\.mongodb\.net|<your-mongodb-url>|your_mongodb_url/i.test(
    mongoURI,
  );
};

/**
 * Connect to MongoDB using Mongoose
 * @returns {Promise<void>}
 */
export const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (isPlaceholderMongoUri(mongoURI)) {
      console.warn(
        "⚠️ MONGODB_URI is missing or looks like a placeholder. Using the in-memory model store for local development.",
      );
      return;
    }

    await mongoose.connect(mongoURI);
    console.log("✓ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ Database connection error:", error.message);
    throw error;
  }
};

/**
 * Disconnect from MongoDB
 * @returns {Promise<void>}
 */
export const disconnectDB = async () => {
  try {
    if (mongoose.connection.readyState) {
      await mongoose.disconnect();
    }

    console.log("✓ MongoDB disconnected successfully");
  } catch (error) {
    console.error("❌ Database disconnection error:", error.message);
    process.exit(1);
  }
};
