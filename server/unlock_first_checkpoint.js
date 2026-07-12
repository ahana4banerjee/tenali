const mongoose = require('mongoose');
const { JOURNEY_CURRICULUM } = require('./lil/learning_journey/journeyData');
const { LearningJourneyProgress } = require('./lil/learning_journey/models');
const { User } = require('./auth');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tenali';

const args = process.argv.slice(2);
const usernameInput = args[0] || 'all'; // "all" to unlock it for everyone

async function run() {
  console.log(`Connecting to MongoDB at ${MONGO_URI}...`);
  await mongoose.connect(MONGO_URI);
  console.log('Connected!');

  // Resolve users
  let usersToUpdate = [];
  if (usernameInput === 'all') {
    usersToUpdate = await User.find({});
  } else {
    const singleUser = await User.findOne({ username: usernameInput.toLowerCase().trim() });
    if (!singleUser) {
      console.error(`Error: User "${usernameInput}" not found.`);
      await mongoose.disconnect();
      process.exit(1);
    }
    usersToUpdate = [singleUser];
  }

  if (usersToUpdate.length === 0) {
    console.log('No users found in database. Make sure you run the server once to seed the default users.');
    await mongoose.disconnect();
    return;
  }

  // Get first topic and its concept keys programmatically
  const firstTopic = JOURNEY_CURRICULUM[0];
  const conceptKeys = firstTopic.concepts.map(c => c.key);
  console.log(`First Topic ID: ${firstTopic.id}`);
  console.log(`Concepts to auto-complete:`, conceptKeys);

  for (const user of usersToUpdate) {
    console.log(`\nProcessing user: ${user.username} (${user._id})`);
    
    // Find or create progression document
    let progress = await LearningJourneyProgress.findOne({ userId: user._id });
    if (!progress) {
      progress = new LearningJourneyProgress({ userId: user._id });
    }

    // Mark concepts complete (avoiding duplicates)
    const updatedConceptsSet = new Set([...progress.completedConcepts, ...conceptKeys]);
    progress.completedConcepts = Array.from(updatedConceptsSet);
    progress.updatedAt = new Date();

    // If they previously completed this topic, reset it so checkpoint can be retried/played
    progress.completedTopics = progress.completedTopics.filter(tid => tid !== firstTopic.id);

    await progress.save();
    console.log(`✓ All concepts completed for "${user.username}". Checkpoint quiz is now active and unlocked!`);
  }

  console.log('\nAll done! You can now view the Topic Timeline path on the web client to take the Checkpoint.');
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error('Script failed with error:', err);
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  process.exit(1);
});
