const Quiz = require('../models/Quiz');
const { generateQuiz } = require('../services/aiQuizService');
const { AppError } = require('../middleware/errorHandler');
const { asyncHandler } = require('../middleware/asyncHandler');

const DIFFICULTIES = ['easy', 'medium', 'hard'];
const QUESTION_TYPES = ['mcq', 'truefalse', 'short'];
const VALID_COUNTS = [5, 10, 15, 20, 30];

const buildTitle = (topic, difficulty, count) =>
  `${topic.charAt(0).toUpperCase() + topic.slice(1)} — ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Quiz`;

/**
 * POST /api/quizzes/generate
 * Body: { topic, difficulty?, count?, questionTypes?, gradeLevel? }
 */
exports.generateQuiz = asyncHandler(async (req, res, next) => {
  const { topic } = req.body;
  const difficulty = req.body.difficulty || 'medium';
  const count = Number(req.body.count) || 10;
  const questionTypes = Array.isArray(req.body.questionTypes) ? req.body.questionTypes : ['mcq', 'truefalse', 'short'];
  const gradeLevel = req.body.gradeLevel || '';

  if (!topic || String(topic).trim().length < 2) {
    return next(new AppError('Please provide a valid topic (at least 2 characters).', 400));
  }
  if (!DIFFICULTIES.includes(difficulty)) {
    return next(new AppError('Difficulty must be easy, medium, or hard.', 400));
  }
  if (!VALID_COUNTS.includes(count)) {
    return next(new AppError('Number of questions must be one of: 5, 10, 15, 20, 30.', 400));
  }
  const invalidTypes = questionTypes.filter((t) => !QUESTION_TYPES.includes(t));
  if (invalidTypes.length > 0) {
    return next(new AppError(`Invalid question type(s): ${invalidTypes.join(', ')}`, 400));
  }

  const cleanTopic = String(topic).trim();

  const { questions, source } = await generateQuiz({
    topic: cleanTopic,
    difficulty,
    count,
    questionTypes,
    gradeLevel,
  });

  if (!questions.length) {
    return next(new AppError('Quiz generation produced no questions. Please try again.', 500));
  }

  const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);
  const estimatedTimeMinutes = Math.max(1, Math.ceil(totalMarks * 1));

  const quiz = await Quiz.create({
    topic: cleanTopic,
    title: buildTitle(cleanTopic, difficulty, count),
    difficulty,
    questionTypes,
    gradeLevel,
    questions,
    totalMarks,
    estimatedTimeMinutes,
    source,
    createdBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    quiz: {
      id: quiz._id,
      topic: quiz.topic,
      title: quiz.title,
      difficulty: quiz.difficulty,
      questionTypes: quiz.questionTypes,
      gradeLevel: quiz.gradeLevel,
      questionCount: quiz.questions.length,
      totalMarks: quiz.totalMarks,
      estimatedTimeMinutes: quiz.estimatedTimeMinutes,
      source: quiz.source,
      createdAt: quiz.createdAt,
    },
  });
});

/**
 * GET /api/quizzes/:id
 * Returns quiz metadata + questions with answers/explanations.
 * The frontend controls whether answers are shown (practice vs test mode).
 */
exports.getQuiz = asyncHandler(async (req, res, next) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) {
    return next(new AppError('Quiz not found.', 404));
  }

  res.status(200).json({
    success: true,
    quiz: {
      id: quiz._id,
      topic: quiz.topic,
      title: quiz.title,
      difficulty: quiz.difficulty,
      questionTypes: quiz.questionTypes,
      gradeLevel: quiz.gradeLevel,
      questionCount: quiz.questions.length,
      totalMarks: quiz.totalMarks,
      estimatedTimeMinutes: quiz.estimatedTimeMinutes,
      source: quiz.source,
      createdAt: quiz.createdAt,
      questions: quiz.questions.map((q) => ({
        id: q._id,
        type: q.type,
        text: q.text,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        marks: q.marks,
      })),
    },
  });
});

/**
 * POST /api/quizzes/:id/attempts
 * Body: { selectedAnswers: {questionId: answer}, mode, timeTakenSeconds }
 * Scores the attempt and persists it.
 */
exports.submitAttempt = asyncHandler(async (req, res, next) => {
  const { QuizAttempt, ApplicationSettings } = require('../models');
  const { scoreAttempt } = require('../services/scoringService');

  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) {
    return next(new AppError('Quiz not found.', 404));
  }

  const settings = await ApplicationSettings.getSettings();
  const mode = req.body.mode === 'practice' ? 'practice' : 'test';
  const timeTakenSeconds = Math.max(0, Number(req.body.timeTakenSeconds) || 0);
  const selectedAnswers = (req.body.selectedAnswers && typeof req.body.selectedAnswers === 'object') ? req.body.selectedAnswers : {};

  const result = scoreAttempt(quiz, { selectedAnswers }, settings.passingPercentage, timeTakenSeconds, mode);

  // Persist the attempt with a full snapshot
  const attempt = await QuizAttempt.create({
    user: req.user._id,
    quiz: quiz._id,
    topic: quiz.topic,
    title: quiz.title,
    difficulty: quiz.difficulty,
    mode,
    questions: result.questions.map((q) => ({
      questionId: q.questionId,
      type: q.type,
      text: q.text,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      marks: q.marks,
      selectedAnswer: q.selectedAnswer,
      isCorrect: q.isCorrect,
      awardedMarks: q.awardedMarks,
    })),
    selectedAnswers,
    score: result.score,
    totalMarks: result.totalMarks,
    percentage: result.percentage,
    passed: result.passed,
    passingPercentage: result.passingPercentage,
    timeTakenSeconds,
  });

  res.status(201).json({
    success: true,
    attemptId: attempt._id,
    result: {
      id: attempt._id,
      score: result.score,
      totalMarks: result.totalMarks,
      percentage: result.percentage,
      passed: result.passed,
      passingPercentage: result.passingPercentage,
      answered: result.answered,
      correct: result.correct,
      incorrect: result.incorrect,
      unanswered: result.unanswered,
      timeTakenSeconds: result.timeTakenSeconds,
      mode,
    },
  });
});