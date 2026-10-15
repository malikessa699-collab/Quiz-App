import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import Alert from '../components/ui/Alert';
import EmptyState from '../components/ui/EmptyState';
import SkeletonCard from '../components/ui/SkeletonCard';
import LoadingScreen from '../components/ui/LoadingScreen';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function Dashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    api
      .get('/api/analytics/summary')
      .then((data) => {
        if (mounted) setAnalytics(data.analytics);
      })
      .catch((err) => {
        if (mounted) setError(err.message || 'Failed to load dashboard.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <SkeletonCard count={4} />;

  const s = analytics?.summary;

  return (
    <div className="animate-fade-up">
      <div className="page-header">
        <h1>Welcome back, {user?.name?.split(' ')[0] || 'Student'} 👋</h1>
        <p className="text-muted">Here's your current preparation status.</p>
      </div>

      <Alert type="error">{error}</Alert>

      {analytics && !analytics.hasEnoughData && (
        <Alert type="info">
          {analytics.message}{' '}
          <Link to="/generate">Generate a quiz</Link> to start tracking your progress.
        </Alert>
      )}

      {/* Stat cards */}
      <div className="grid grid--4 stagger" style={{ marginBottom: '2rem' }}>
        <StatCard icon="🎯" label="Overall Preparation" value={s ? `${s.overallPreparation}%` : '—'} />
        <StatCard icon="📝" label="Quizzes Attempted" value={s ? s.totalAttempts : 0} />
        <StatCard icon="⭐" label="Average Score" value={s ? `${s.averagePercentage}%` : '—'} />
        <StatCard icon="🏆" label="Highest Score" value={s ? `${s.highestScore}%` : '—'} />
      </div>

      <div className="grid grid--2" style={{ marginBottom: '2rem' }}>
        {/* Pass/Fail summary */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Pass / Fail Summary</h3>
          {s && s.totalAttempts > 0 ? (
            <>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div className="stat-card" style={{ flex: 1 }}>
                  <span className="stat-card__label">Passed</span>
                  <span className="stat-card__value" style={{ color: 'var(--success)' }}>{s.totalPassed}</span>
                </div>
                <div className="stat-card" style={{ flex: 1 }}>
                  <span className="stat-card__label">Failed</span>
                  <span className="stat-card__value" style={{ color: 'var(--danger)' }}>{s.totalFailed}</span>
                </div>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: `${s.totalAttempts ? Math.round((s.totalPassed / s.totalAttempts) * 100) : 0}%`,
                    background: 'var(--success)',
                  }}
                />
              </div>
              <p className="text-small text-muted" style={{ marginTop: '0.6rem' }}>
                {Math.round((s.totalPassed / s.totalAttempts) * 100)}% pass rate
              </p>
            </>
          ) : (
            <EmptyState icon="📊" title="No data yet" message="Your pass/fail summary will appear here after your first quiz." />
          )}
        </div>

        {/* Recommendations */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Recommended Next Steps</h3>
          {analytics?.recommendations?.length ? (
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {analytics.recommendations.map((r, i) => (
                <li key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1rem' }}>💡</span>
                  <span className="text-small">{r}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon="✨" title="All caught up" message="Take a quiz to receive personalized recommendations." />
          )}
        </div>
      </div>

      {/* Weak / strong topics */}
      <div className="grid grid--2" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Weak Topics — Need Practice</h3>
          {analytics?.weakTopics?.length ? (
            <div className="stagger">
              {analytics.weakTopics.map((t) => (
                <div key={t.topic} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid var(--powder-light)' }}>
                  <strong>{t.topic}</strong>
                  <Badge type="danger">{t.averagePercentage}% avg</Badge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="💪" title="No weak topics" message="Great work — no topic is below the 70% threshold." />
          )}
        </div>
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Strong Topics</h3>
          {analytics?.strongTopics?.length ? (
            <div className="stagger">
              {analytics.strongTopics.map((t) => (
                <div key={t.topic} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid var(--powder-light)' }}>
                  <strong>{t.topic}</strong>
                  <Badge type="success">{t.averagePercentage}% avg</Badge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="🌱" title="No strong topics yet" message="Keep practicing — strong topics appear at 80% or above." />
          )}
        </div>
      </div>

      {/* Recent results */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>Recent Quiz Results</h3>
          <Link to="/history" className="btn btn--outline btn--sm">View all</Link>
        </div>
        {analytics?.recent?.length ? (
          <div className="stagger">
            {analytics.recent.map((r) => (
              <Link
                key={r.id}
                to={`/results/${r.id}`}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.9rem 0.4rem', borderBottom: '1px solid var(--powder-light)', borderRadius: 'var(--radius-sm)', color: 'var(--slate)' }}
                className="navbar__link"
              >
                <div>
                  <strong>{r.title}</strong>
                  <div className="text-small text-muted">{r.topic} · {formatDate(r.completionDate)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                  <strong style={{ color: 'var(--cadet-dark)' }}>{r.percentage}%</strong>
                  <Badge type={r.passed ? 'success' : 'danger'}>{r.passed ? 'PASS' : 'FAIL'}</Badge>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="📚"
            title="No quizzes yet"
            message="Take your first quiz to see results here."
            action={<Link to="/generate" className="btn btn--sm">Generate a Quiz</Link>}
          />
        )}
      </div>
    </div>
  );
}

export default Dashboard;