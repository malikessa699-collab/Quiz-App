const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['mcq', 'truefalse', 'short'],
      required: true,
    },
    text: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
    },
    options: {
      type: [String],
      default: [],
      // MCQ: array of 4 options; True/False: ['True', 'False']
    },
    correctAnswer: {
      type: String,
      required: [true, 'Correct answer is required'],
      trim: true,
    },
    explanation: {
      type: String,
      default: '',
      trim: true,
    },
    marks: {
      type: Number,
      default: 1,
      min: [0, 'Marks cannot be negative'],
    },
  },
  { _id: true }
);

// Validate that MCQ questions have 4 options and a consistent answer
questionSchema.pre('validate', function (next) {
  if (this.type === 'mcq' && this.options.length !== 4) {
    return next(new Error('MCQ questions must have exactly 4 options'));
  }
  if (this.type === 'mcq' && !this.options.includes(this.correctAnswer)) {
    return next(new Error('Correct answer must be one of the MCQ options'));
  }
  if (this.type === 'truefalse') {
    const allowed = ['True', 'False'];
    this.options = allowed.slice();
    if (!allowed.includes(this.correctAnswer)) {
      return next(new Error('True/False answer must be True or False'));
    }
  }
  next();
});

const quizSchema = new mongoose.Schema(
  {
    topic: {
      type: String,
      required: [true, 'Topic is required'],
      trim: true,
      maxlength: [120, 'Topic cannot exceed 120 characters'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    questionTypes: {
      type: [String],
      enum: ['mcq', 'truefalse', 'short'],
      default: ['mcq', 'truefalse', 'short'],
    },
    gradeLevel: {
      type: String,
      default: '',
    },
    questions: {
      type: [questionSchema],
      default: [],
    },
    totalMarks: {
      type: Number,
      default: 0,
    },
    estimatedTimeMinutes: {
      type: Number,
      default: 10,
    },
    source: {
      type: String,
      enum: ['ai', 'builtin'],
      default: 'builtin',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

quizSchema.index({ createdBy: 1, createdAt: -1 });
quizSchema.index({ topic: 'text' });

module.exports = mongoose.model('Quiz', quizSchema);