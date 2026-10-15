/**
 * Scoring Service.
 *
 * Evaluates a submitted attempt against the quiz answer key.
 * The backend always computes the final score — the frontend never
 * sends a trusted score.
 */

const { AppError } = require('../middleware/errorHandler');

/**
 * Normalize an answer for comparison (case-insensitive, trimmed,
 * whitespace-collapsed) so short answers like "cpu" match "CPU".
 */
function normalizeAnswer(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/**
 * Evaluate MCQ / True-False answers (exact match against options).
 */
function evaluateChoice(selected, correct, type) {
  if (!selected || String(selected).trim() === '') return { isCorrect: false, answered: false };
  const s = normalizeAnswer(selected);
  const c = normalizeAnswer(correct);
  return { isCorrect: s === c, answered: true };
}

/**
 * Evaluate short answers with a small tolerance:
 * - exact normalized match
 * - or the selected answer contains the correct answer (or vice versa)
 *   when both are reasonably short
 */
function evaluateShort(selected, correct) {
  if (!selected || String(selected).trim() === '') return { isCorrect: false, answered: false };
  const s = normalizeAnswer(selected);
  const c = normalizeAnswer(correct);
  if (s === c) return { isCorrect: true, answered: true };
  const shortEnough = s.length >= 3 && c.length >= 3;
  if (shortEnough && (s.includes(c) || c.includes(s))) return { isCorrect: true, answered: true };
  return { isCorrect: false, answered: true };
}

/**
 * Score an attempt.
 * @param {object} quiz - Quiz document with questions array
 * @param {object} submitted - { selectedAnswers: {questionId: answer} }
 * @param {number} passingPercentage - configured threshold
 * @param {number} timeTakenSeconds - time spent on the quiz
 * @param {string} mode - 'practice' | 'test'
 * @returns scored attempt payload (questions snapshot + totals)
 */
function scoreAttempt(quiz, submitted, passingPercentage, timeTakenSeconds, mode) {
  const selectedAnswers = (submitted && submitted.selectedAnswers) || {};

  const questions = quiz.questions.map((q) => {
    const selectedAnswer = selectedAnswers[q._id] || selectedAnswers[String(q._id)] || null;

    let result;
    if (q.type === 'short') {
      result = evaluateShort(selectedAnswer, q.correctAnswer);
    } else {
      result = evaluateChoice(selectedAnswer, q.correctAnswer, q.type);
    }

    return {
      questionId: q._id,
      type: q.type,
      text: q.text,
      options: q.options || [],
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || '',
      marks: q.marks || 1,
      selectedAnswer: result.answered ? selectedAnswer : null,
      isCorrect: result.isCorrect,
      awardedMarks: result.isCorrect ? q.marks || 1 : 0,
    };
  });

  const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);
  const score = questions.reduce((sum, q) => sum + q.awardedMarks, 0);
  const answered = questions.filter((q) => q.selectedAnswer !== null).length;
  const correct = questions.filter((q) => q.isCorrect).length;
  const incorrect = questions.filter((q) => q.selectedAnswer !== null && !q.isCorrect).length;
  const unanswered = questions.length - answered;
  const percentage = totalMarks > 0 ? Math.round(((score / totalMarks) * 100) * 100) / 100 : 0;
  const passed = percentage >= passingPercentage;

  return {
    questions,
    score,
    totalMarks,
    percentage,
    passed,
    passingPercentage,
    answered,
    correct,
    incorrect,
    unanswered,
    timeTakenSeconds,
    mode,
  };
}

module.exports = { scoreAttempt, normalizeAnswer, evaluateChoice, evaluateShort };