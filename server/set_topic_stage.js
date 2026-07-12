/**
 * Utility Script: Set Concept Mastery Revision Stage
 * 
 * Usage:
 *   node server/set_topic_stage.js [username] [topicId] [stage]
 * 
 * Examples:
 *   node server/set_topic_stage.js tatsavit addition 2
 *   (Sets addition to stage 2, so the next successful revision in UI will hit stage 3 and show God Mode!)
 * 
 *   node server/set_topic_stage.js tatsavit addition 3
 *   (Sets addition to stage 3, showing "Mastery Achieved" badge on the dashboard immediately!)
 */

const mongoose = require('mongoose');
const { ConceptMastery } = require('./lil/models');
const { User } = require('./auth');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tenali';

const args = process.argv.slice(2);
const username = (args[0] || 'tatsavit').toLowerCase().trim();
const topicId = (args[1] || 'addition').toLowerCase().trim();
const stage = parseInt(args[2] ?? '2', 10);

async function run() {
  console.log(`Connecting to MongoDB at ${MONGO_URI}...`);
  await mongoose.connect(MONGO_URI);
  console.log('Connected!');

  // Resolve user
  const user = await User.findOne({ username });
  if (!user) {
    console.error(`Error: User "${username}" not found in database.`);
    await mongoose.disconnect();
    process.exit(1);
  }

  const userId = user._id;
  console.log(`Resolved user "${username}" to ID: ${userId}`);

  // Find or create ConceptMastery record
  let record = await ConceptMastery.findOne({ userId, topicId });
  let isNew = false;
  if (!record) {
    record = new ConceptMastery({ userId, topicId });
    isNew = true;
    console.log(`No existing record found for topic "${topicId}". Creating a new one.`);
  }

  // Update properties
  record.isMastered = true;
  record.revisionStage = stage;
  record.lastRevisedAt = new Date();
  record.completedAt = record.completedAt || new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
  record.learningLocked = false;
  record.graceSessionUsed = false;
  record.revisionRequired = false;

  await record.save();

  console.log('\n--- UPDATE SUCCESSFUL ---');
  console.log(`User:            ${username}`);
  console.log(`Topic:           ${topicId}`);
  console.log(`Mastery Record:  ${isNew ? 'Created' : 'Updated'}`);
  console.log(`isMastered:      ${record.isMastered}`);
  console.log(`revisionStage:   ${record.revisionStage} (Label: ${record.revisionStage >= 3 ? 'Mastery Achieved' : `Revision ${record.revisionStage}`})`);
  console.log(`lastRevisedAt:   ${record.lastRevisedAt}`);
  console.log('-------------------------\n');

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB.');
}

run().catch(async (err) => {
  console.error('An error occurred:', err);
  await mongoose.disconnect();
  process.exit(1);
});
