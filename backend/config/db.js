import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const isAtlas = process.env.MONGO_URI?.startsWith('mongodb+srv://');
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      ...(isAtlas && {
        tls: true,
        tlsAllowInvalidCertificates: false,
        family: 4, // Force IPv4, avoids IPv6 TLS handshake issues on Windows
      }),
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
