const { test } = require('node:test');
const assert = require('node:assert');
const { buildAnalytics } = require('../src/services/analyticsService');

function makeAttempts(list) {
  return list.map((a, i) => ({
    _id: `a${i + 1}`,
    topic: a.topic,
    title: `${a.topic} Quiz`,
    difficulty: a.difficulty || 'medium',
    percentage: a.percentage,
    passed: a.passed,
    completionDate: new Date(Date.now() - i * 86400000),
  }));
}

test('buildAnalytics: empty attempts yields hasEnoughData false', () => {
  const result = buildAnalytics([]);
  assert.strictEqual(result.hasEnoughData, false);
  assert.strictEqual(result.summary.totalAttempts, 0);
  assert.ok(result.recommendations.length > 0);
});

test('buildAnalytics: computes summary statistics correctly', () => {
  const attempts = makeAttempts([
    { topic: 'Math', percentage: 80, passed: true },
    { topic: 'Math', percentage: 60, passed: true },
    { topic: 'Science', percentage: 40, passed: false },
  ]);
  const result = buildAnalytics(attempts);
  assert.strictEqual(result.hasEnoughData, true);
  assert.strictEqual(result.summary.totalAttempts, 3);
  assert.strictEqual(result.summary.averagePercentage, 60);
  assert.strictEqual(result.summary.highestScore, 80);
  assert.strictEqual(result.summary.totalPassed, 2);
  assert.strictEqual(result.summary.totalFailed, 1);
});

test('buildAnalytics: identifies weak and strong topics', () => {
  const attempts = makeAttempts([
    { topic: 'Weak', percentage: 50, passed: true },
    { topic: 'Weak', percentage: 45, passed: false },
    { topic: 'Strong', percentage: 90, passed: true },
    { topic: 'Strong', percentage: 85, passed: true },
    { topic: 'Mid', percentage: 75, passed: true },
  ]);
  const result = buildAnalytics(attempts);
  assert.ok(result.weakTopics.some((t) => t.topic === 'Weak'));
  assert.ok(result.strongTopics.some((t) => t.topic === 'Strong'));
  assert.ok(!result.strongTopics.some((t) => t.topic === 'Mid'));
});

test('buildAnalytics: aggregates topic-wise averages', () => {
  const attempts = makeAttempts([
    { topic: 'Math', percentage: 80, passed: true },
    { topic: 'Math', percentage: 60, passed: true },
    { topic: 'Science', percentage: 100, passed: true },
  ]);
  const result = buildAnalytics(attempts);
  const math = result.topics.find((t) => t.topic === 'Math');
  assert.strictEqual(math.attempts, 2);
  assert.strictEqual(math.averagePercentage, 70);
  assert.strictEqual(math.bestScore, 80);
});