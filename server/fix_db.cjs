const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const result = await db.collection('subscriptionplans').updateMany(
    { appLimit: { $exists: true } },
    [
      { $set: { publishingCredits: '$appLimit' } },
      { $unset: 'appLimit' }
    ]
  );
  console.log(result);
  
  // Verify what is in the DB now
  const plans = await db.collection('subscriptionplans').find({}).toArray();
  console.log(JSON.stringify(plans, null, 2));
  
  process.exit(0);
}).catch(console.error);
