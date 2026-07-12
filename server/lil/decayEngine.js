const DECAY_STAGES = [
  { stage: 0, label: 'Initial Learning', decayPercent: 5, intervalMs: 48 * 60 * 60 * 1000 },
  { stage: 1, label: 'Revision 1',       decayPercent: 3, intervalMs: 72 * 60 * 60 * 1000 },
  { stage: 2, label: 'Revision 2',       decayPercent: 2, intervalMs: 96 * 60 * 60 * 1000 },
  { stage: 3, label: 'Revision 3+',      decayPercent: 1, intervalMs: 7 * 24 * 60 * 60 * 1000 }
];

const HEALTH_FLOOR = 40;

function formatCountdown(ms) {
  if (ms <= 0) return '0h';
  const totalHours = Math.ceil(ms / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  return `${hours}h`;
}

function calculateAdaptiveHealth(lastRevisedAt, completedAt, revisionStage = 0) {
  const baselineTime = lastRevisedAt || completedAt;
  if (!baselineTime) {
    return {
      health: 0,
      stageConfig: DECAY_STAGES[0],
      msUntilNextDecay: 0,
      estimatedCountdown: '0h'
    };
  }

  const stageIndex = Math.min(revisionStage, DECAY_STAGES.length - 1);
  const stageConfig = DECAY_STAGES[stageIndex];

  const elapsedMs = Date.now() - new Date(baselineTime).getTime();
  const fullIntervals = Math.floor(elapsedMs / stageConfig.intervalMs);
  const health = Math.max(HEALTH_FLOOR, 100 - (fullIntervals * stageConfig.decayPercent));

  // Time remaining until the next decay tick
  const msIntoCurrentInterval = elapsedMs % stageConfig.intervalMs;
  const msUntilNextDecay = health > HEALTH_FLOOR
    ? stageConfig.intervalMs - msIntoCurrentInterval
    : 0;

  return {
    health,
    stageConfig,
    msUntilNextDecay,
    estimatedCountdown: formatCountdown(msUntilNextDecay)
  };
}

function getWarningLevel(health) {
  if (health <= 40) {
    return { level: 'red', message: 'Revision Required' };
  }
  if (health <= 50) {
    return { level: 'yellow', message: 'Rusty' };
  }
  return null;
}

module.exports = {
  calculateAdaptiveHealth,
  getWarningLevel,
  DECAY_STAGES,
  HEALTH_FLOOR
};
