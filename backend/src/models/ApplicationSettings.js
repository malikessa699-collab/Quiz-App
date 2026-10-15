const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    passingPercentage: {
      type: Number,
      default: 50,
      min: [0, 'Passing percentage cannot be below 0'],
      max: [100, 'Passing percentage cannot exceed 100'],
    },
    defaultTimerMinutes: {
      type: Number,
      default: 10,
      min: [1, 'Timer must be at least 1 minute'],
      max: [180, 'Timer cannot exceed 180 minutes'],
    },
    quizGenerationRateLimit: {
      type: Number,
      default: 10,
      min: [1, 'Rate limit must be at least 1'],
    },
    allowPracticeMode: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Singleton settings document
settingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne({});
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('ApplicationSetting', settingsSchema);