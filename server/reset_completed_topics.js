const mongoose = require('mongoose');
const { LearningJourneyProgress } = require('./lil/learning_journey/models');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tenali';

async function run() {
  console.log(`Connecting to MongoDB at ${MONGO_URI}...`);
  await mongoose.connect(MONGO_URI);
  console.log('Connected!');

  // Completely reset all progress fields back to pristine initial state for all users
  const result = await LearningJourneyProgress.updateMany(
    {},
    {
      $set: {
        completedTopics: [],
        completedConcepts: [],
        conceptsNeedingRevision: [],
        latestCheckpointScore: {},
        checkpointAttempts: [],
        activeCheckpoint: null
      }
    }
  );

  console.log(`Successfully reset all learning journey progress fields for all users.`);
  console.log(`Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);

  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Error executing reset script:', err);
  mongoose.disconnect();
  process.exit(1);
});
