import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api';
import Alert from '../components/ui/Alert';
import Badge from '../components/ui/Badge';
import LoadingScreen from '../components/ui/LoadingScreen';

const LETTERS = ['A', 'B', 'C', 'D'];

function AnswerReview() {
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
        if (mounted) setError(err.message || 'Failed to load review.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [attemptId]);

  if (loading) return <LoadingScreen label="Loading answer review…" />;

  if (error || !attempt) {
    return (
      <div className="container" style={{ paddingTop: '2.5rem' }}>
        <Alert type="error">{error || 'Attempt not found.'}</Alert>
        <Link to="/history" className="btn">Back to history</Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-up" style={{ maxWidth: '820px', margin: '0 auto' }}>
      <div className="page-header">
        <h1>Answer Review</h1>
        <p className="text-muted">
          {attempt.title} · {attempt.score}/{attempt.totalMarks} marks · {Math.round(attempt.percentage)}%
        </p>
      </div>

      <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        {attempt.questions.map((q, i) => {
          const selected = q.selectedAnswer;
          const correct = q.isCorrect;
          return (
            <div className="card" key={q.questionId || i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <Badge type="slate">Q{i + 1}</Badge>
                <Badge type={correct ? 'success' : 'danger'}>
                  {correct ? `✓ Correct (+${q.awardedMarks})` : selected === null ? '✗ Unanswered' : '✗ Incorrect'}
                </Badge>
              </div>

              <strong style={{ display: 'block', marginBottom: '0.8rem' }}>{q.text}</strong>

              {q.type === 'short' ? (
                <div style={{ marginBottom: '0.8rem' }}>
                  <p className="text-small text-muted">Your answer:</p>
                  <p style={{ fontWeight: 600, color: correct ? 'var(--success)' : 'var(--danger)' }}>
                    {selected || '—'}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.8rem' }}>
                  {q.options.map((opt, oi) => {
                    const isCorrectOpt = opt === q.correctAnswer;
                    const isSelectedOpt = opt === selected;
                    let cls = '';
                    if (isCorrectOpt) cls = ' option--correct';
                    else if (isSelectedOpt && !correct) cls = ' option--wrong';
                    return (
                      <div key={oi} className={`option${cls}`} style={{ cursor: 'default' }}>
                        <span className="option__letter">{LETTERS[oi] || oi + 1}</span>
                        <span>{opt}</span>
                        {isCorrectOpt && <span className="text-small" style={{ color: 'var(--success)', marginLeft: 'auto' }}>✓ Correct</span>}
                        {isSelectedOpt && !isCorrectOpt && <span className="text-small" style={{ color: 'var(--danger)', marginLeft: 'auto' }}>✗ Your answer</span>}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="alert alert--success" style={{ marginBottom: 0 }}>
                <strong>Correct answer:</strong> {q.correctAnswer}
                {q.explanation && (
                  <div style={{ marginTop: '0.4rem' }}>
                    <strong>Explanation:</strong> {q.explanation}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: '0.8rem', marginTop: '2rem', flexWrap: 'wrap' }}>
        <Link to={`/results/${attempt.id}`} className="btn btn--outline">Back to Results</Link>
        <Link to="/generate" className="btn">Practice Again</Link>
      </div>
    </div>
  );
}

export default AnswerReview;