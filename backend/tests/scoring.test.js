const { test } = require('node:test');
const assert = require('node:assert');
const { scoreAttempt, normalizeAnswer, evaluateShort } = require('../src/services/scoringService');

function makeQuiz(questions) {
  return {
    questions: questions.map((q, i) => ({
      _id: `q${i + 1}`,
      ...q,
    })),
  };
}

test('scoreAttempt: all correct MCQ yields 100% and passes', () => {
  const quiz = makeQuiz([
    { type: 'mcq', text: 'Q1', options: ['A', 'B', 'C', 'D'], correctAnswer: 'A', explanation: 'e', marks: 1 },
    { type: 'mcq', text: 'Q2', options: ['A', 'B', 'C', 'D'], correctAnswer: 'B', explanation: 'e', marks: 1 },
  ]);
  const result = scoreAttempt(quiz, { selectedAnswers: { q1: 'A', q2: 'B' } }, 50, 30, 'test');
  assert.strictEqual(result.score, 2);
  assert.strictEqual(result.totalMarks, 2);
  assert.strictEqual(result.percentage, 100);
  assert.strictEqual(result.passed, true);
  assert.strictEqual(result.correct, 2);
  assert.strictEqual(result.incorrect, 0);
  assert.strictEqual(result.unanswered, 0);
});

test('scoreAttempt: partial marks and pass/fail threshold', () => {
  const quiz = makeQuiz([
    { type: 'mcq', text: 'Q1', options: ['A', 'B', 'C', 'D'], correctAnswer: 'A', explanation: '', marks: 1 },
    { type: 'mcq', text: 'Q2', options: ['A', 'B', 'C', 'D'], correctAnswer: 'B', explanation: '', marks: 1 },
    { type: 'mcq', text: 'Q3', options: ['A', 'B', 'C', 'D'], correctAnswer: 'C', explanation: '', marks: 1 },
    { type: 'mcq', text: 'Q4', options: ['A', 'B', 'C', 'D'], correctAnswer: 'D', explanation: '', marks: 1 },
  ]);
  // Only 1 of 4 correct => 25%
  const result = scoreAttempt(quiz, { selectedAnswers: { q1: 'A', q2: 'Z', q3: 'Z', q4: 'Z' } }, 50, 30, 'test');
  assert.strictEqual(result.score, 1);
  assert.strictEqual(result.percentage, 25);
  assert.strictEqual(result.passed, false);
});

test('scoreAttempt: unanswered questions counted as incorrect', () => {
  const quiz = makeQuiz([
    { type: 'mcq', text: 'Q1', options: ['A', 'B', 'C', 'D'], correctAnswer: 'A', explanation: '', marks: 1 },
    { type: 'mcq', text: 'Q2', options: ['A', 'B', 'C', 'D'], correctAnswer: 'B', explanation: '', marks: 1 },
  ]);
  const result = scoreAttempt(quiz, { selectedAnswers: { q1: 'A' } }, 50, 30, 'test');
  assert.strictEqual(result.answered, 1);
  assert.strictEqual(result.unanswered, 1);
  assert.strictEqual(result.score, 1);
  assert.strictEqual(result.percentage, 50);
});

test('scoreAttempt: true/false validation', () => {
  const quiz = makeQuiz([
    { type: 'truefalse', text: 'T1', options: ['True', 'False'], correctAnswer: 'True', explanation: '', marks: 1 },
    { type: 'truefalse', text: 'T2', options: ['True', 'False'], correctAnswer: 'False', explanation: '', marks: 1 },
  ]);
  const result = scoreAttempt(quiz, { selectedAnswers: { q1: 'True', q2: 'True' } }, 50, 30, 'test');
  assert.strictEqual(result.score, 1);
  assert.strictEqual(result.correct, 1);
});

test('evaluateShort: matches with whitespace and case tolerance', () => {
  assert.strictEqual(evaluateShort('pacific', 'Pacific').isCorrect, true);
  assert.strictEqual(evaluateShort('central processing', 'Central Processing Unit').isCorrect, true);
  assert.strictEqual(evaluateShort('wrong', 'Pacific').isCorrect, false);
});

test('normalizeAnswer collapses whitespace and lowercases', () => {
  assert.strictEqual(normalizeAnswer('  Hello   World  '), 'hello world');
});