const { test } = require('node:test');
const assert = require('node:assert');
const { generateBuiltin, validateQuestion } = require('../src/services/aiQuizService');

test('generateBuiltin produces the requested number of questions', () => {
  const questions = generateBuiltin({ topic: 'Python', difficulty: 'easy', questionTypes: ['mcq'], count: 5 });
  assert.strictEqual(questions.length, 5);
  questions.forEach((q) => {
    assert.strictEqual(q.type, 'mcq');
    assert.strictEqual(q.options.length, 4);
    assert.ok(q.options.includes(q.correctAnswer));
    assert.ok(q.text.length > 0);
  });
});

test('generateBuiltin mixes question types when requested', () => {
  const questions = generateBuiltin({ topic: 'General', difficulty: 'medium', questionTypes: ['mcq', 'truefalse', 'short'], count: 6 });
  const types = new Set(questions.map((q) => q.type));
  assert.ok(types.has('mcq'));
  assert.ok(types.has('truefalse'));
  assert.ok(types.has('short'));
});

test('generateBuiltin true/false always uses True/False options', () => {
  const questions = generateBuiltin({ topic: 'General', difficulty: 'easy', questionTypes: ['truefalse'], count: 2 });
  questions.forEach((q) => {
    assert.deepStrictEqual(q.options, ['True', 'False']);
    assert.ok(['True', 'False'].includes(q.correctAnswer));
  });
});

test('validateQuestion rejects MCQs without 4 options', () => {
  assert.throws(
    () => validateQuestion({ type: 'mcq', text: 'A long valid question here?', options: ['A', 'B'], correctAnswer: 'A' }, 0),
    /exactly 4 options/
  );
});

test('validateQuestion rejects MCQs where the answer is not an option', () => {
  assert.throws(
    () => validateQuestion({ type: 'mcq', text: 'A long valid question here?', options: ['A', 'B', 'C', 'D'], correctAnswer: 'X' }, 0),
    /match one option/
  );
});

test('validateQuestion accepts a valid MCQ', () => {
  const q = validateQuestion({ type: 'mcq', text: 'What is 2+2?', options: ['3', '4', '5', '6'], correctAnswer: '4', explanation: 'Basic addition' }, 0);
  assert.strictEqual(q.correctAnswer, '4');
  assert.strictEqual(q.marks, 1);
});