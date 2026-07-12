const mongoose = require('mongoose');
const { ConceptMastery } = require('./lil/models');
const { User } = require('./auth');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tenali';

async function decayConcept() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const topicIdInput = process.argv[2];
  const daysAgoInput = process.argv[3];
  const usernameInput = process.argv[4] || 'tatsavit';

  if (!topicIdInput) {
    console.log('Usage: node decay_db.js <topicId> [daysAgo] [username]');
    console.log('No arguments provided. Defaulting to: topic "addition", 10 days ago, user "tatsavit"\n');
  }

  const topicId = topicIdInput || 'addition';
  const username = (usernameInput || 'tatsavit').toLowerCase().trim();

  const user = await User.findOne({ username });
  if (!user) {
    console.error(`User "${username}" not found`);
    await mongoose.disconnect();
    return;
  }

  const record = await ConceptMastery.findOne({ userId: user._id, topicId });
  
  let daysAgo = 10;
  if (daysAgoInput) {
    daysAgo = parseFloat(daysAgoInput);
  } else if (record) {
    // Dynamically calculate days to hit 40% health based on revision stage
    const DECAY_STAGES = [
      { stage: 0, decayPercent: 5, intervalMs: 48 * 60 * 60 * 1000 },
      { stage: 1, decayPercent: 3, intervalMs: 72 * 60 * 60 * 1000 },
      { stage: 2, decayPercent: 2, intervalMs: 96 * 60 * 60 * 1000 },
      { stage: 3, decayPercent: 1, intervalMs: 7 * 24 * 60 * 60 * 1000 }
    ];
    const stageIdx = Math.min(record.revisionStage || 0, DECAY_STAGES.length - 1);
    const stageConfig = DECAY_STAGES[stageIdx];
    const intervals = Math.ceil(60 / stageConfig.decayPercent);
    const elapsedMs = intervals * stageConfig.intervalMs;
    daysAgo = elapsedMs / (24 * 60 * 60 * 1000);
    console.log(`Auto-calculated decay timeline: Topic "${topicId}" is at stage ${record.revisionStage}.`);
    console.log(`Decaying to 40% health requires ${daysAgo} days of inactivity.`);
  }

  const targetDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

  if (record) {
    record.completedAt = targetDate;
    if (record.lastRevisedAt) {
      record.lastRevisedAt = targetDate;
    }
    // Keep the current revisionStage intact
    record.graceSessionUsed = false;
    record.learningLocked = false;
    record.revisionRequired = false;
    await record.save();

    // Check if the user specified a custom daysAgo that doesn't reach 40%
    const DECAY_STAGES = [
      { stage: 0, decayPercent: 5, intervalMs: 48 * 60 * 60 * 1000 },
      { stage: 1, decayPercent: 3, intervalMs: 72 * 60 * 60 * 1000 },
      { stage: 2, decayPercent: 2, intervalMs: 96 * 60 * 60 * 1000 },
      { stage: 3, decayPercent: 1, intervalMs: 7 * 24 * 60 * 60 * 1000 }
    ];
    const stageIdx = Math.min(record.revisionStage || 0, DECAY_STAGES.length - 1);
    const stageConfig = DECAY_STAGES[stageIdx];
    const intervals = Math.floor((daysAgo * 24 * 3600 * 1000) / stageConfig.intervalMs);
    const calculatedHealth = Math.max(40, 100 - intervals * stageConfig.decayPercent);
    if (calculatedHealth > 40) {
      console.log(`\n⚠️ NOTE: Decaying to ${daysAgo} days ago only reduced health to ${calculatedHealth}%.`);
      console.log(`To see the revision queue, health must be <= 40%.`);
      console.log(`For stage ${record.revisionStage}, run without daysAgo argument to auto-decay to 40% health.`);
    }
  } else {
    console.log(`No mastery record found for user "${username}" and topic "${topicId}". Creating a new one...`);
    await ConceptMastery.create({
      userId: user._id,
      topicId,
      isMastered: true,
      completedAt: targetDate,
      lastRevisedAt: null,
      revisionStage: 0,
      graceSessionUsed: false,
      learningLocked: false,
      revisionRequired: false
    });
  }

  console.log(`Successfully decayed "${topicId}" mastery record for user "${username}" to ${daysAgo} days ago (${targetDate.toISOString()}) while preserving stage.`);
  await mongoose.disconnect();
}

decayConcept().catch(console.error);