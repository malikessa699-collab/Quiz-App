import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import Alert from '../components/ui/Alert';
import Badge from '../components/ui/Badge';
import LoadingScreen from '../components/ui/LoadingScreen';

function QuizInstructions() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [mode, setMode] = useState('test');
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api
      .get(`/api/quizzes/${id}`)
      .then((data) => {
        if (mounted) setQuiz(data.quiz);
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

  if (loading) return <LoadingScreen label="Loading quiz details…" />;

  if (error) {
    return (
      <div className="container" style={{ paddingTop: '2.5rem' }}>
        <Alert type="error">{error}</Alert>
        <Link to="/generate" className="btn">Generate another quiz</Link>
      </div>
    );
  }

  const difficultyColor = { easy: 'success', medium: 'warning', hard: 'danger' };

  const startQuiz = () => {
    navigate(`/quiz/${id}/take?mode=${mode}&timer=${timerEnabled ? 'on' : 'off'}`);
  };

  return (
    <div className="animate-fade-up">
      <div className="card" style={{ maxWidth: '720px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.8rem' }}>
          <div>
            <h1 style={{ marginBottom: '0.4rem' }}>{quiz.title}</h1>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Badge type="cadet">{quiz.topic}</Badge>
              <Badge type={difficultyColor[quiz.difficulty]}>{quiz.difficulty}</Badge>
              {quiz.source === 'ai' ? <Badge type="slate">✨ AI-generated</Badge> : <Badge type="slate">Built-in bank</Badge>}
            </div>
          </div>
        </div>

        <div className="grid grid--2" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-card">
            <span className="stat-card__label">Questions</span>
            <span className="stat-card__value">{quiz.questionCount}</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__label">Total Marks</span>
            <span className="stat-card__value">{quiz.totalMarks}</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__label">Passing Score</span>
            <span className="stat-card__value">50%</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__label">Est. Time</span>
            <span className="stat-card__value">{quiz.estimatedTimeMinutes} min</span>
          </div>
        </div>

        <Alert type="info">
          <strong>Rules:</strong> Answers and explanations are hidden while the timer is running. You'll receive your full result, correct answers, and explanations immediately after submission.
        </Alert>

        {/* Mode selection */}
        <div className="form-group">
          <label>Choose your mode</label>
          <div style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`btn ${mode === 'test' ? '' : 'btn--outline'}`}
              onClick={() => setMode('test')}
            >
              🧪 Test Mode — answers hidden
            </button>
            <button
              type="button"
              className={`btn ${mode === 'practice' ? '' : 'btn--outline'}`}
              onClick={() => setMode('practice')}
            >
              📖 Practice Mode — view answers after each question
            </button>
          </div>
        </div>

        {/* Timer option */}
        <div className="form-group">
          <label>Countdown timer</label>
          <div style={{ display: 'flex', gap: '0.7rem' }}>
            <button type="button" className={`btn ${timerEnabled ? '' : 'btn--outline'}`} onClick={() => setTimerEnabled(true)}>
              ⏱ Timer on
            </button>
            <button type="button" className={`btn ${!timerEnabled ? '' : 'btn--outline'}`} onClick={() => setTimerEnabled(false)}>
              🚫 No timer
            </button>
          </div>
        </div>

        <button onClick={startQuiz} className="btn btn--lg btn--block">
          Start Quiz →
        </button>
      </div>
    </div>
  );
}

export default QuizInstructions;