import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api';
import Alert from '../components/ui/Alert';
import Badge from '../components/ui/Badge';
import LoadingScreen from '../components/ui/LoadingScreen';

function formatDuration(seconds) {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function QuizResults() {
  const { attemptId } = useParams();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    api
      .get(`/api/attempts/${attemptId}`)
      .then((data) => {
        if (mounted) setAttempt(data.attempt);
      })
      .catch((err) => {
        if (mounted) setError(err.message || 'Failed to load result.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [attemptId]);

  if (loading) return <LoadingScreen label="Loading your result…" />;

  if (error || !attempt) {
    return (
      <div className="container" style={{ paddingTop: '2.5rem' }}>
        <Alert type="error">{error || 'Result not found.'}</Alert>
        <Link to="/dashboard" className="btn">Back to dashboard</Link>
      </div>
    );
  }

  const pct = Math.round(attempt.percentage);
  const passed = attempt.passed;

  return (
    <div className="animate-fade-up" style={{ maxWidth: '860px', margin: '0 auto' }}>
      {/* Result hero */}
      <div
        className="result-hero animate-pop"
        style={{ ['--pct' ]: pct }}
      >
        <div className="result-hero__ring">
          <div className="result-hero__ring-inner">
            <span className="result-hero__pct">{pct}%</span>
            <span className="text-small text-muted">score</span>
          </div>
        </div>

        <Badge type={passed ? 'success' : 'danger'} style={{ fontSize: '0.95rem', padding: '0.4rem 1.2rem' }}>
          {passed ? '🎉 PASSED' : '📚 KEEP PRACTICING'}
        </Badge>
        <h2 style={{ margin: '1rem 0 0.4rem' }}>{attempt.title}</h2>
        <p className="text-muted">{attempt.topic} · {new Date(attempt.completionDate).toLocaleDateString()}</p>

        <p style={{ margin: '1.2rem 0', maxWidth: '480px', marginInline: 'auto' }}>
          {passed
            ? 'Excellent work! You met the passing threshold. Review your answers to reinforce what you learned.'
            : `You scored below the ${attempt.passingPercentage}% passing threshold. Don't worry — review the answers and try again to improve.`}
        </p>

        <div className="grid grid--4" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-card">
            <span className="stat-card__label">Marks</span>
            <span className="stat-card__value">{attempt.score}/{attempt.totalMarks}</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__label">Correct</span>
            <span className="stat-card__value" style={{ color: 'var(--success)' }}>{attempt.questions.filter((q) => q.isCorrect).length}</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__label">Wrong / Skipped</span>
            <span className="stat-card__value" style={{ color: 'var(--danger)' }}>
              {attempt.questions.filter((q) => !q.isCorrect).length}
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-card__label">Time Taken</span>
            <span className="stat-card__value" style={{ fontSize: '1.2rem' }}>{formatDuration(attempt.timeTakenSeconds)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to={`/review/${attempt.id}`} className="btn btn--lg">Review All Answers</Link>
          <Link to="/generate" className="btn btn--outline btn--lg">Practice Again</Link>
          <Link to="/history" className="btn btn--ghost btn--lg">View History</Link>
        </div>
      </div>
    </div>
  );
}

export default QuizResults;