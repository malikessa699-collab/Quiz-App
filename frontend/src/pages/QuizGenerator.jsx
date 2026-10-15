import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import Alert from '../components/ui/Alert';

const TOPIC_SUGGESTIONS = [
  'Python Programming',
  'Mathematics',
  'Computer Science',
  'English Grammar',
  'Physics',
  'Chemistry',
  'Biology',
  'History',
  'Geography',
  'Web Development',
  'General Knowledge',
];

function QuizGenerator() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    topic: '',
    difficulty: 'medium',
    count: 10,
    questionTypes: ['mcq', 'truefalse', 'short'],
    gradeLevel: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const toggleType = (type) => {
    setForm((f) => {
      const has = f.questionTypes.includes(type);
      if (has && f.questionTypes.length === 1) return f;
      return {
        ...f,
        questionTypes: has ? f.questionTypes.filter((t) => t !== type) : [...f.questionTypes, type],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.topic.trim()) {
      setError('Please enter a topic.');
      return;
    }
    setLoading(true);
    try {
      const data = await api.post('/api/quizzes/generate', {
        topic: form.topic,
        difficulty: form.difficulty,
        count: Number(form.count),
        questionTypes: form.questionTypes,
        gradeLevel: form.gradeLevel,
      });
      navigate(`/quiz/${data.quiz.id}/instructions`);
    } catch (err) {
      setError(err.message || 'Failed to generate quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-up">
      <div className="page-header">
        <h1>Generate a New Quiz</h1>
        <p className="text-muted">Enter any topic — our AI engine builds a fresh, relevant quiz for you.</p>
      </div>

      <div className="card" style={{ maxWidth: '680px', margin: '0 auto' }}>
        <Alert type="error">{error}</Alert>
        <Alert type="info">
          💡 No AI key configured? QuizCraft automatically falls back to a built-in question bank so you can start practicing immediately.
        </Alert>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="topic">Topic or subject</label>
            <input
              id="topic"
              name="topic"
              className="input"
              placeholder="e.g. Python Programming, World War II, Photosynthesis…"
              value={form.topic}
              onChange={handleChange}
              required
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.8rem' }}>
              {TOPIC_SUGGESTIONS.map((t) => (
                <button
                  key={t}
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => setForm((f) => ({ ...f, topic: t }))}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="gradeLevel">Grade / education level (optional)</label>
            <input
              id="gradeLevel"
              name="gradeLevel"
              className="input"
              placeholder="e.g. Grade 8, High School, University 1st year"
              value={form.gradeLevel}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Difficulty</label>
            <div style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap' }}>
              {['easy', 'medium', 'hard'].map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`btn ${form.difficulty === d ? '' : 'btn--outline'}`}
                  style={{ textTransform: 'capitalize' }}
                  onClick={() => setForm((f) => ({ ...f, difficulty: d }))}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Number of questions</label>
            <div style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap' }}>
              {[5, 10, 15, 20, 30].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`btn ${Number(form.count) === n ? '' : 'btn--outline'}`}
                  onClick={() => setForm((f) => ({ ...f, count: n }))}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Question types</label>
            <div style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap' }}>
              {[
                { value: 'mcq', label: 'Multiple Choice' },
                { value: 'truefalse', label: 'True / False' },
                { value: 'short', label: 'Short Answer' },
              ].map((t) => (
                <button
                  key={t.value}
                  type="button"
                  className={`btn ${form.questionTypes.includes(t.value) ? '' : 'btn--outline'}`}
                  onClick={() => toggleType(t.value)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn--lg btn--block" disabled={loading}>
            {loading ? '✨ Generating your quiz…' : '🚀 Generate Quiz'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default QuizGenerator;