const mongoose = require('mongoose');
const { ConceptMastery } = require('./lil/models');
const { User } = require('./auth');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tenali';

async function checkDb() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const masteries = await ConceptMastery.find({});
  console.log('Total Mastery Records:', masteries.length);
  for (const m of masteries) {
    const u = await User.findById(m.userId);
    console.log(`User: ${u ? u.username : m.userId}, Topic: ${m.topicId}, isMastered: ${m.isMastered}, completedAt: ${m.completedAt}`);
  }

  await mongoose.disconnect();
}

checkDb().catch(console.error);
