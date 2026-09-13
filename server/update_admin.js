import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb://127.0.0.1:27017/apporbit';

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.useDb('apporbit');
    const users = await db.collection('users').find({}, { projection: { email: 1, role: 1 } }).toArray();
    console.log(users);
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
