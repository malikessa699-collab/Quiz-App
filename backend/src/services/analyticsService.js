/**
 * Analytics Service.
 *
 * Computes a student's preparation assessment from real quiz attempts.
 * Returns aggregated stats, subject-wise performance, weak/strong topics,
 * recent results, and actionable recommendations.
 */

const MIN_ATTEMPTS_FOR_ASSESSMENT = 2;

/**
 * Build preparation analytics for a user.
 * @param {object[]} attempts - QuizAttempt documents (already loaded for user)
 */
function buildAnalytics(attempts) {
  const total = attempts.length;

  if (total === 0) {
    return {
      hasEnoughData: false,
      message: 'No quiz attempts yet. Complete at least 2 quizzes to see your preparation assessment.',
      summary: {
        totalAttempts: 0,
        averagePercentage: 0,
        highestScore: 0,
        totalPassed: 0,
        totalFailed: 0,
        overallPreparation: 0,
      },
      topics: [],
      recent: [],
      weakTopics: [],
      strongTopics: [],
      recommendations: ['Take your first quiz to begin tracking your preparation.'],
    };
  }

  const averagePercentage =
    total > 0
      ? Math.round((attempts.reduce((sum, a) => sum + a.percentage, 0) / total) * 100) / 100
      : 0;
  const highestScore = Math.max(...attempts.map((a) => a.percentage));
  const totalPassed = attempts.filter((a) => a.passed).length;
  const totalFailed = attempts.filter((a) => !a.passed).length;
  const overallPreparation = Math.round(averagePercentage * 100) / 100;

  // Topic aggregation
  const topicMap = {};
  attempts.forEach((a) => {
    if (!topicMap[a.topic]) {
      topicMap[a.topic] = { topic: a.topic, attempts: 0, totalPercentage: 0, scores: [] };
    }
    topicMap[a.topic].attempts += 1;
    topicMap[a.topic].totalPercentage += a.percentage;
    topicMap[a.topic].scores.push(a.percentage);
  });

  const topics = Object.values(topicMap).map((t) => ({
    topic: t.topic,
    attempts: t.attempts,
    averagePercentage: Math.round((t.totalPercentage / t.attempts) * 100) / 100,
    bestScore: Math.max(...t.scores),
    trend: t.scores.length >= 2 ? t.scores[t.scores.length - 1] - t.scores[0] : 0,
  }));

  const recent = attempts
    .slice(0, 5)
    .map((a) => ({
      id: a._id,
      topic: a.topic,
      title: a.title,
      percentage: a.percentage,
      passed: a.passed,
      difficulty: a.difficulty,
      completionDate: a.completionDate,
    }));

  // Weak / strong topics (thresholds: <70% weak, >=80% strong)
  const weakTopics = topics
    .filter((t) => t.averagePercentage < 70)
    .sort((a, b) => a.averagePercentage - b.averagePercentage);
  const strongTopics = topics
    .filter((t) => t.averagePercentage >= 80)
    .sort((a, b) => b.averagePercentage - a.averagePercentage);

  // Trend: compare first half vs second half averages
  const mid = Math.floor(total / 2);
  const firstHalf = attempts.slice(0, mid);
  const secondHalf = attempts.slice(mid);
  const firstAvg = firstHalf.length ? firstHalf.reduce((s, a) => s + a.percentage, 0) / firstHalf.length : 0;
  const secondAvg = secondHalf.length ? secondHalf.reduce((s, a) => s + a.percentage, 0) / secondHalf.length : 0;
  const trend = Math.round((secondAvg - firstAvg) * 100) / 100;

  // Recommendations
  const recommendations = [];
  if (weakTopics.length > 0) {
    recommendations.push(
      `Focus on your weakest topics: ${weakTopics.map((t) => t.topic).slice(0, 3).join(', ')}. Generate practice quizzes for these next.`
    );
  }
  if (trend > 0) {
    recommendations.push('Your recent performance is improving. Keep up the consistent practice!');
  } else if (trend < 0) {
    recommendations.push('Your recent scores have dipped slightly. Review your latest results and retry weak topics.');
  }
  if (recommendations.length === 0) {
    recommendations.push('Great balance across topics. Try new topics to broaden your preparation.');
  }
  if (total < MIN_ATTEMPTS_FOR_ASSESSMENT) {
    recommendations.push('Complete one more quiz to get a more reliable preparation assessment.');
  }

  const hasEnoughData = total >= MIN_ATTEMPTS_FOR_ASSESSMENT;

  return {
    hasEnoughData,
    message: hasEnoughData
      ? 'Your preparation assessment is based on your recent quiz attempts.'
      : 'Complete at least 2 quizzes to unlock a reliable preparation assessment.',
    summary: {
      totalAttempts: total,
      averagePercentage,
      highestScore,
      totalPassed,
      totalFailed,
      overallPreparation,
    },
    trend,
    topics,
    recent,
    weakTopics,
    strongTopics,
    recommendations,
  };
}

module.exports = { buildAnalytics, MIN_ATTEMPTS_FOR_ASSESSMENT };