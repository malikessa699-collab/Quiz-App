import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import Alert from '../components/ui/Alert';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';
import LoadingScreen from '../components/ui/LoadingScreen';

const LETTERS = ['A', 'B', 'C', 'D'];

function ActiveQuiz() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const mode = searchParams.get('mode') === 'practice' ? 'practice' : 'test';
  const timerEnabled = searchParams.get('timer') !== 'off';

  const [quiz, setQuiz] = useState(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [marked, setMarked] = useState({});
  const [showPracticeAnswer, setShowPracticeAnswer] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  // Refs that always hold the latest values (avoids stale closures in timer/submit)
  const answersRef = useRef({});
  const submittedRef = useRef(false);
  const startRef = useRef(Date.now());
  const modeRef = useRef(mode);
  const idRef = useRef(id);
  const navigateRef = useRef(navigate);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    idRef.current = id;
  }, [id]);

  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  const quizTimeSeconds = useMemo(() => {
    if (!quiz) return 0;
    return (quiz.estimatedTimeMinutes || 10) * 60;
  }, [quiz]);

  // Load quiz
  useEffect(() => {
    let mounted = true;
    api
      .get(`/api/quizzes/${id}`)
      .then((data) => {
        if (!mounted) return;
        setQuiz(data.quiz);
        startRef.current = Date.now();
      })
      .catch((err) => {
        if (mounted) setError(err.message || 'Failed to load quiz.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [id]);

  // Stable submit function using refs (works from timer callbacks)
  const submitQuiz = async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    setShowSubmitDialog(false);

    const timeTakenSeconds = Math.round((Date.now() - startRef.current) / 1000);
    const payload = answersRef.current;
    const currentMode = modeRef.current;
    const currentId = idRef.current;
    const go = navigateRef.current;

    try {
      const data = await api.post(`/api/quizzes/${currentId}/attempts`, {
        selectedAnswers: payload,
        mode: currentMode,
        timeTakenSeconds,
      });
      go(`/results/${data.attemptId}`);
    } catch (err) {
      setError(err.message || 'Failed to submit quiz.');
      submittedRef.current = false;
      setSubmitting(false);
    }
  };

  // Timer
  useEffect(() => {
    if (!quiz || !timerEnabled) return;
    setTimeLeft(quizTimeSeconds);
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t === null) return t;
        if (t <= 1) {
          clearInterval(interval);
          submitQuiz();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz, timerEnabled, quizTimeSeconds]);

  if (loading) return <LoadingScreen label="Preparing your quiz…" />;

  if (error && !quiz) {
    return (
      <div style={{ padding: '2.5rem', maxWidth: '640px', margin: '0 auto' }}>
        <Alert type="error">{error || 'Quiz not found.'}</Alert>
        <button className="btn" onClick={() => navigate('/generate')}>Back to generator</button>
      </div>
    );
  }

  const questions = quiz.questions;
  const total = questions.length;
  const q = questions[current];
  const answeredCount = Object.keys(answers).length;

  const formatTime = (secs) => {
    if (secs === null) return '';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const selectAnswer = (questionId, value) => {
    setAnswers((a) => ({ ...a, [questionId]: value }));
    if (mode === 'practice') setShowPracticeAnswer(true);
  };

  const toggleMark = (questionId) => {
    setMarked((m) => ({ ...m, [questionId]: !m[questionId] }));
  };

  const goTo = (i) => {
    setCurrent(i);
    setShowPracticeAnswer(false);
  };

  const requestSubmit = () => {
    if (submittedRef.current) return;
    setShowSubmitDialog(true);
  };

  const renderQuestion = (qObj) => {
    const isCorrectHere = mode === 'practice' && showPracticeAnswer && answers[qObj.id] === qObj.correctAnswer;
    const isWrongHere = mode === 'practice' && showPracticeAnswer && answers[qObj.id] && answers[qObj.id] !== qObj.correctAnswer;
    return (
      <div key={qObj.id} style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
          <Badge type="cadet">
            {qObj.type === 'mcq' ? 'Multiple Choice' : qObj.type === 'truefalse' ? 'True / False' : 'Short Answer'}
          </Badge>
          <span className="text-small text-muted">{qObj.marks} mark{qObj.marks > 1 ? 's' : ''}</span>
        </div>
        <strong style={{ fontSize: '1.05rem', display: 'block', marginBottom: '1rem' }}>{qObj.text}</strong>

        {qObj.type === 'short' ? (
          <input
            className="input"
            placeholder="Type your answer…"
            value={answers[qObj.id] || ''}
            onChange={(e) => selectAnswer(qObj.id, e.target.value)}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
            {qObj.options.map((opt, oi) => {
              const selected = answers[qObj.id] === opt;
              const showCorrect = mode === 'practice' && showPracticeAnswer && opt === qObj.correctAnswer;
              const showWrong = mode === 'practice' && showPracticeAnswer && selected && opt !== qObj.correctAnswer;
              return (
                <button
                  key={oi}
                  type="button"
                  className={`option${selected ? ' option--selected' : ''}${showCorrect ? ' option--correct' : ''}${showWrong ? ' option--wrong' : ''}`}
                  onClick={() => selectAnswer(qObj.id, opt)}
                >
                  <span className="option__letter">{LETTERS[oi] || oi + 1}</span>
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>
        )}

        {mode === 'practice' && showPracticeAnswer && (
          <div className="alert alert--success animate-fade-up" style={{ marginTop: '1rem' }}>
            <strong>✓ Correct answer:</strong> {qObj.correctAnswer}
            {qObj.explanation && (
              <div style={{ marginTop: '0.4rem' }}>
                <strong>Why:</strong> {qObj.explanation}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', padding: '1.5rem 0 3rem' }}>
      <div className="container" style={{ maxWidth: '860px' }}>
        {/* Header bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', flexWrap: 'wrap', gap: '0.6rem' }}>
          <strong style={{ fontSize: '1.05rem' }}>{quiz.title}</strong>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {timerEnabled && (
              <span className="badge badge--cadet" style={{ fontVariantNumeric: 'tabular-nums' }}>
                ⏱ {formatTime(timeLeft)}
              </span>
            )}
            <span className="badge badge--slate">
              {answeredCount}/{total} answered
            </span>
          </div>
        </div>

        <ProgressBar value={current + 1} max={total} />

        <Alert type="error">{error}</Alert>

        {/* Question card */}
        <div className="question-card animate-fade-up" key={q.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
            <Badge type="slate">Question {current + 1} of {total}</Badge>
            <button
              type="button"
              className={`btn btn--sm ${marked[q.id] ? '' : 'btn--outline'}`}
              onClick={() => toggleMark(q.id)}
            >
              {marked[q.id] ? '★ Marked' : '☆ Mark for review'}
            </button>
          </div>

          {renderQuestion(q)}

          <div className="question-nav">
            <button type="button" className="btn btn--outline" disabled={current === 0} onClick={() => goTo(current - 1)}>
              ← Previous
            </button>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              {questions.map((qItem, i) => (
                <button
                  key={qItem.id}
                  type="button"
                  onClick={() => goTo(i)}
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    border: '2px solid var(--powder)',
                    background: answers[qItem.id] ? 'var(--cadet)' : 'var(--white)',
                    color: answers[qItem.id] ? 'var(--white)' : 'var(--slate)',
                    fontWeight: '700',
                    fontSize: '0.85rem',
                    boxShadow: i === current ? '0 0 0 3px var(--cadet-light)' : 'none',
                  }}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            {current < total - 1 ? (
              <button type="button" className="btn" onClick={() => goTo(current + 1)}>
                Next →
              </button>
            ) : (
              <button type="button" className="btn btn--success" onClick={requestSubmit} disabled={submitting}>
                Submit Quiz
              </button>
            )}
          </div>
        </div>
      </div>

      {showSubmitDialog && (
        <Modal
          title="Submit your quiz?"
          onClose={() => setShowSubmitDialog(false)}
          footer={
            <>
              <button className="btn btn--outline" onClick={() => setShowSubmitDialog(false)}>Keep answering</button>
              <button className="btn btn--success" onClick={submitQuiz} disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit now'}
              </button>
            </>
          }
        >
          <p>
            You have answered <strong>{answeredCount}</strong> of <strong>{total}</strong> questions.
            {total - answeredCount > 0 && (
              <> <strong>{total - answeredCount}</strong> unanswered question{total - answeredCount > 1 ? 's will' : ' will'} be counted as incorrect.</>
            )}
          </p>
          <p className="text-small text-muted" style={{ marginTop: '0.6rem' }}>
            After submitting you cannot change your answers.
          </p>
        </Modal>
      )}
    </div>
  );
}

export default ActiveQuiz;