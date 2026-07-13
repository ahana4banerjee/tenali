const mongoose = require('mongoose');

// Schema for Attempts
const AttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topicId: { type: String, required: true },
  difficulty: { type: String, default: 'easy' },
  userAnswer: { type: String, default: '' },
  isCorrect: { type: Boolean, required: true },
  sessionGoal: { type: String, default: 'standard' },
  prompt: { type: String, default: '' },
  correctAnswer: { type: mongoose.Schema.Types.Mixed, default: '' },
  display: { type: String, default: '' },
  options: { type: mongoose.Schema.Types.Mixed, default: null },
  questionData: { type: mongoose.Schema.Types.Mixed, default: null },
  telemetry: {
    timeSpentMs: { type: Number, default: 0 },
    inputEditsCount: { type: Number, default: 0 },
    hintRequestedImmediately: { type: Boolean, default: false },
    idleDurationMs: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now }
});

// Compound index for user topic timeline queries (like analytics)
AttemptSchema.index({ userId: 1, topicId: 1, createdAt: -1 });

// Schema for Concept Mastery
const ConceptMasterySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topicId: { type: String, required: true },
  isMastered: { type: Boolean, default: false },
  incorrectStreak: { type: Number, default: 0 },
  completedAt: { type: Date },
  lastRevisedAt: { type: Date },
  revisionStage: { type: Number, default: 0 },
  graceSessionUsed: { type: Boolean, default: false },
  learningLocked: { type: Boolean, default: false },
  revisionRequired: { type: Boolean, default: false },
  lastAttemptAt: { type: Date }
});

// Ensure a single mastery record exists per user per topic
ConceptMasterySchema.index({ userId: 1, topicId: 1 }, { unique: true });
// Sparse index for learningLocked checks
ConceptMasterySchema.index({ userId: 1, learningLocked: 1 }, { sparse: true });

// Schema for Learning Events
const LearningEventSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  eventId: { type: String, required: true },
  eventType: { type: String, required: true },
  topicId: { type: String },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now }
});

LearningEventSchema.index({ userId: 1, eventType: 1 });

const Attempt = mongoose.models.Attempt || mongoose.model('Attempt', AttemptSchema);
const ConceptMastery = mongoose.models.ConceptMastery || mongoose.model('ConceptMastery', ConceptMasterySchema);
const LearningEvent = mongoose.models.LearningEvent || mongoose.model('LearningEvent', LearningEventSchema);

module.exports = {
  Attempt,
  ConceptMastery,
  LearningEvent
};

