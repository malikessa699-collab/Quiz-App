import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import Alert from '../components/ui/Alert';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import LoadingScreen from '../components/ui/LoadingScreen';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDuration(seconds) {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function History() {
  const [attempts, setAttempts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);

  const load = (page = 1) => {
    setLoading(true);
    setError('');
    api
      .get(`/api/attempts/history?page=${page}&limit=10`)
      .then((data) => {
        setAttempts(data.attempts);
        setPagination(data.pagination);
      })
      .catch((err) => setError(err.message || 'Failed to load history.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(1);
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this attempt? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await api.delete(`/api/attempts/${id}`);
      load(pagination.page);
    } catch (err) {
      setError(err.message || 'Failed to delete attempt.');
    } finally {
      setDeleting(null);
    }
  };

  if (loading && attempts.length === 0) return <LoadingScreen label="Loading your history…" />;

  return (
    <div className="animate-fade-up">
      <div className="page-header">
        <h1>Quiz History</h1>
        <p className="text-muted">All your completed quizzes and results.</p>
      </div>

      <Alert type="error">{error}</Alert>

      {attempts.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="📚"
            title="No quizzes attempted yet"
            message="Your saved quiz attempts will appear here."
            action={<Link to="/generate" className="btn">Generate a Quiz</Link>}
          />
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Quiz</th>
                  <th>Topic</th>
                  <th>Difficulty</th>
                  <th>Score</th>
                  <th>Result</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a) => (
                  <tr key={a.id}>
                    <td><strong>{a.title}</strong></td>
                    <td>{a.topic}</td>
                    <td><Badge type="slate" style={{ textTransform: 'capitalize' }}>{a.difficulty}</Badge></td>
                    <td>{a.score}/{a.totalMarks} ({Math.round(a.percentage)}%)</td>
                    <td><Badge type={a.passed ? 'success' : 'danger'}>{a.passed ? 'PASS' : 'FAIL'}</Badge></td>
                    <td className="text-small text-muted">{formatDate(a.completionDate)}<br />{formatDuration(a.timeTakenSeconds)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <Link to={`/results/${a.id}`} className="btn btn--outline btn--sm">Result</Link>
                        <Link to={`/review/${a.id}`} className="btn btn--sm">Review</Link>
                        <button className="btn btn--danger btn--sm" disabled={deleting === a.id} onClick={() => handleDelete(a.id)}>
                          {deleting === a.id ? '…' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
              <button className="btn btn--outline btn--sm" disabled={pagination.page <= 1} onClick={() => load(pagination.page - 1)}>
                ← Prev
              </button>
              <span className="badge badge--cadet">Page {pagination.page} of {pagination.pages}</span>
              <button className="btn btn--outline btn--sm" disabled={pagination.page >= pagination.pages} onClick={() => load(pagination.page + 1)}>
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default History;