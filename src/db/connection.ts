import mongoose from 'mongoose';
import '@/db/models/Booking';
import '@/db/models/Property';
import '@/db/models/PropertyPrices'; // ← nowy model
import '@/db/models/Season';         // ← potrzebny dla middleware kaskadowego
import '@/db/models/PriceConfig';
import '@/db/models/SystemConfig';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI)
      .then((m) => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;