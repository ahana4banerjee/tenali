const mongoose = require('mongoose');
const { User } = require('./auth');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tenali';

async function checkUser() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const users = await User.find({});
  console.log('Total Users:', users.length);
  for (const u of users) {
    console.log(`Username: "${u.username}", ID: ${u._id}`);
  }

  await mongoose.disconnect();
}

checkUser().catch(console.error);
