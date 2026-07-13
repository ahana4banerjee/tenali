const { ConceptMastery } = require('./models');
const { calculateAdaptiveHealth } = require('./decayEngine');

/**
 * Updates mastery statistics and determines if a concept is mastered.
 * Implements Concept Health Decay, grace periods, locks, and streak regression.
 * 
 * @param {String} userId 
 * @param {String} topicId 
 * @param {Boolean} isCorrect 
 * @returns {Promise<Object>} The updated mastery status metrics
 */
async function update(userId, topicId, isCorrect) {
  let record = await ConceptMastery.findOne({ userId, topicId });
  if (!record) {
    record = new ConceptMastery({
      userId,
      topicId,
      isMastered: false,
      incorrectStreak: 0,
      revisionStage: 0,
      graceSessionUsed: false,
      learningLocked: false,
      revisionRequired: false
    });
  }

  let newlyMastered = false;

  // Track dynamic health and grace session usage before modifying streak
  if (record.isMastered) {
    const { health } = calculateAdaptiveHealth(record.lastRevisedAt, record.completedAt, record.revisionStage);
    if (health <= 40) {
      const now = new Date();
      const isSameSession = record.lastAttemptAt && (now - record.lastAttemptAt < 20 * 60 * 1000);
      if (!isSameSession) {
        if (!record.graceSessionUsed) {
          record.graceSessionUsed = true;
          record.revisionRequired = true;
        } else {
          record.learningLocked = true;
          record.revisionRequired = true;
        }
      }
      record.lastAttemptAt = now;
    }
  }

  if (isCorrect) {
    record.incorrectStreak = 0;
    // Standard baseline mastery rule: mark completed on correct answer
    if (!record.isMastered) {
      record.isMastered = true;
      newlyMastered = true;
      record.completedAt = new Date();
      record.lastRevisedAt = new Date();
      record.revisionStage = 0;
      record.graceSessionUsed = false;
      record.learningLocked = false;
      record.revisionRequired = false;
    }
  } else {
    record.incorrectStreak += 1;
    // Regress mastery if 3 consecutive incorrect attempts occur
    if (record.incorrectStreak >= 3 && record.isMastered) {
      record.isMastered = false;
      record.completedAt = null;
      record.lastRevisedAt = null;
      record.revisionStage = 0;
      record.graceSessionUsed = false;
      record.learningLocked = false;
      record.revisionRequired = false;
    }
  }

  await record.save();

  return {
    isMastered: record.isMastered,
    newlyMastered,
    incorrectStreak: record.incorrectStreak
  };
}

module.exports = {
  update
};

