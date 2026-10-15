const mongoose = require('mongoose');

const attemptQuestionSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    type: {
      type: String,
      enum: ['mcq', 'truefalse', 'short'],
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    options: {
      type: [String],
      default: [],
    },
    correctAnswer: {
      type: String,
      required: true,
    },
    explanation: {
      type: String,
      default: '',
    },
    marks: {
      type: Number,
      default: 1,
    },
    selectedAnswer: {
      type: String,
      default: null,
    },
    isCorrect: {
      type: Boolean,
      default: null,
    },
    awardedMarks: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const attemptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
    },
    // Snapshot of quiz metadata at the time of the attempt
    topic: { type: String, required: true },
    title: { type: String, required: true },
    difficulty: { type: String, required: true },
    mode: {
      type: String,
      enum: ['practice', 'test'],
      default: 'test',
    },
    questions: {
      type: [attemptQuestionSchema],
      default: [],
    },
    selectedAnswers: {
      type: Map,
      of: String,
      default: {},
    },
    score: {
      type: Number,
      default: 0,
    },
    totalMarks: {
      type: Number,
      default: 0,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    passed: {
      type: Boolean,
      default: false,
    },
    passingPercentage: {
      type: Number,
      default: 50,
    },
    timeTakenSeconds: {
      type: Number,
      default: 0,
    },
    completionDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

attemptSchema.index({ user: 1, completionDate: -1 });
attemptSchema.index({ user: 1, topic: 1 });

module.exports = mongoose.model('QuizAttempt', attemptSchema);