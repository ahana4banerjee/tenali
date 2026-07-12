const assert = require('assert');
const { calculateAdaptiveHealth, getWarningLevel } = require('./lil/decayEngine');
const RevisionService = require('./lil/revisionService');

console.log('Starting Concept Health Decay Engine Unit Tests...');

// Mock Date.now() for testing
const RealDateNow = Date.now;
function mockDateNow(targetTime) {
Date.now = () => targetTime;
}
function restoreDateNow() {
Date.now = RealDateNow;
}

try {
// Test Case 1: Stage 0 (Initial Learning) - 5% every 48 hours
console.log('Testing Stage 0 Decay...');
const baseTime = new Date('2026-07-01T00:00:00Z').getTime();

// 1 day elapsed (24 hours) - should still be 100% since it decays every 48 hours
mockDateNow(baseTime + (24 * 60 * 60 * 1000));
let result = calculateAdaptiveHealth(null, baseTime, 0);
assert.strictEqual(result.health, 100);
assert.strictEqual(result.estimatedCountdown, '1d 0h');

// 2 days elapsed (48 hours) - decays by 5%
mockDateNow(baseTime + (48 * 60 * 60 * 1000));
result = calculateAdaptiveHealth(null, baseTime, 0);
assert.strictEqual(result.health, 95);

// 24 days elapsed (24 * 48 hours = 24 intervals * 5% = 120% decay capped at 0%)
mockDateNow(baseTime + (24 * 48 * 60 * 60 * 1000));
result = calculateAdaptiveHealth(null, baseTime, 0);
assert.strictEqual(result.health, 0);
assert.strictEqual(result.estimatedCountdown, '0h');

console.log('Testing Stage 1 Decay (3% every 72 hours)...');
// 3 days elapsed (72 hours) - Stage 1 decays by 3%
mockDateNow(baseTime + (72 * 60 * 60 * 1000));
result = calculateAdaptiveHealth(null, baseTime, 1);
assert.strictEqual(result.health, 97);
assert.strictEqual(result.estimatedCountdown, '3d 0h');

console.log('Testing Stage 2 Decay (2% every 96 hours)...');
// 4 days elapsed (96 hours) - Stage 2 decays by 2%
mockDateNow(baseTime + (96 * 60 * 60 * 1000));
result = calculateAdaptiveHealth(null, baseTime, 2);
assert.strictEqual(result.health, 98);

console.log('Testing Stage 3 Lock (No decay after mastery for standard topics)...');
// 7 days elapsed (168 hours) - Stage 3 health should be locked at 100% for standard topics
mockDateNow(baseTime + (7 * 24 * 60 * 60 * 1000));
result = calculateAdaptiveHealth(null, baseTime, 3);
assert.strictEqual(result.health, 100);
assert.strictEqual(result.estimatedCountdown, 'Never');

console.log('Testing Stage 3 Decay for addition topic override...');
result = calculateAdaptiveHealth(null, baseTime, 3, 'addition');
assert.strictEqual(result.health, 99);

console.log('Testing Warning Levels...');
assert.deepStrictEqual(getWarningLevel(100), null);
assert.deepStrictEqual(getWarningLevel(55), null);
assert.deepStrictEqual(getWarningLevel(50), { level: 'yellow', message: 'Rusty' });
assert.deepStrictEqual(getWarningLevel(45), { level: 'yellow', message: 'Rusty' });
assert.deepStrictEqual(getWarningLevel(40), { level: 'red', message: 'Revision Required' });

console.log('Testing Revision Evaluation...');
// 8 out of 10 correct = 80% (Pass)
const passAnswers = Array(10).fill(null).map((_, i) => ({ isCorrect: i < 8 }));
const passResult = RevisionService.evaluateRevision(passAnswers);
assert.strictEqual(passResult.passed, true);
assert.strictEqual(passResult.score, 8);
assert.strictEqual(passResult.percentage, 80);

// 7 out of 10 correct = 70% (Fail)
const failAnswers = Array(10).fill(null).map((_, i) => ({ isCorrect: i < 7 }));
const failResult = RevisionService.evaluateRevision(failAnswers);
assert.strictEqual(failResult.passed, false);
assert.strictEqual(failResult.score, 7);
assert.strictEqual(failResult.percentage, 70);

console.log('All Concept Health Decay Engine Unit Tests Passed Successfully!');
} catch (e) {
console.error('Unit Test Failed:', e);
process.exit(1);
} finally {
restoreDateNow();
}
