import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  {
    icon: '🤖',
    title: 'AI-Generated Quizzes',
    desc: 'Type any topic — Python, biology, history, or anything else — and get a fresh, relevant quiz instantly.',
  },
  {
    icon: '🎯',
    title: 'Real Assessments',
    desc: 'MCQs, True/False, and short answers with timers, progress tracking, and automatic scoring.',
  },
  {
    icon: '✅',
    title: 'Answers & Explanations',
    desc: 'Learn from every question with clear explanations and full answer reviews after each test.',
  },
  {
    icon: '📈',
    title: 'Preparation Analytics',
    desc: 'Track your scores, spot weak topics, and see your improvement over time with helpful charts.',
  },
];

const STEPS = [
  { n: '1', title: 'Choose a topic', desc: 'Enter any subject or learning area you want to practice.' },
  { n: '2', title: 'Take the quiz', desc: 'Answer questions with a timer, progress bar, and review options.' },
  { n: '3', title: 'Get your result', desc: 'Receive an instant score, pass/fail verdict, and detailed explanations.' },
];

function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCTA = () => {
    navigate(user ? '/generate' : '/register');
  };

  return (
    <div>
      {/* Hero */}
      <section className="hero">
        <div className="container hero__content">
          <div className="animate-fade-up">
            <h1>Generate quizzes on any topic. Master your preparation.</h1>
            <p>
              QuizCraft turns any subject into a personalized practice quiz with real assessment,
              automatic scoring, and smart analytics — so you always know where you stand.
            </p>
            <div className="hero__actions">
              <button className="btn btn--lg" onClick={handleCTA}>
                {user ? 'Create a Quiz' : 'Get Started Free'}
              </button>
              <Link to="/login" className="btn btn--outline btn--lg">
                Sign In
              </Link>
            </div>
          </div>

          <div className="hero__visual animate-pop delay-1">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.2rem' }}>
              <span className="navbar__logo">Q</span>
              <strong>Python Basics Quiz</strong>
            </div>
            <div className="progress-track" style={{ marginBottom: '1.2rem' }}>
              <div className="progress-fill" style={{ width: '60%' }} />
            </div>
            {[
              { t: 'What is the output of print(2 ** 3)?', s: '8', correct: true },
              { t: 'Which keyword defines a function?', s: 'def', correct: true },
              { t: 'What type is 3.14 in Python?', s: 'float', correct: true },
            ].map((q, i) => (
              <div
                key={i}
                style={{
                  background: i === 0 ? 'var(--success-bg)' : 'var(--powder-light)',
                  border: `2px solid ${i === 0 ? 'var(--success)' : 'var(--powder)'}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.7rem 1rem',
                  marginBottom: '0.7rem',
                  fontSize: '0.9rem',
                }}
              >
                <strong>{q.t}</strong>
                <div className="text-small text-muted">Answer: {q.s}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section" style={{ background: 'var(--white)', borderTop: '1px solid var(--powder)', borderBottom: '1px solid var(--powder)' }}>
        <div className="container">
          <h2 className="text-center" style={{ marginBottom: '2.5rem' }}>Everything you need to prepare with confidence</h2>
          <div className="grid grid--4 stagger">
            {FEATURES.map((f) => (
              <div className="feature-card" key={f.title}>
                <div className="feature-card__icon">{f.icon}</div>
                <h3 style={{ marginBottom: '0.5rem' }}>{f.title}</h3>
                <p className="text-small text-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section">
        <div className="container">
          <h2 className="text-center" style={{ marginBottom: '2.5rem' }}>How it works</h2>
          <div className="grid grid--3 stagger">
            {STEPS.map((s) => (
              <div className="card card--hover text-center" key={s.n}>
                <div
                  className="stat-card__icon"
                  style={{ width: '44px', height: '44px', borderRadius: '50%', margin: '0 auto 1rem' }}
                >
                  {s.n}
                </div>
                <h3 style={{ marginBottom: '0.5rem' }}>{s.title}</h3>
                <p className="text-small text-muted">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section" style={{ background: 'var(--white)', borderTop: '1px solid var(--powder)' }}>
        <div className="container text-center animate-fade-up">
          <h2 style={{ marginBottom: '0.8rem' }}>Ready to see how prepared you really are?</h2>
          <p className="text-muted" style={{ marginBottom: '1.8rem', maxWidth: '520px', marginInline: 'auto' }}>
            Join QuizCraft and turn any topic into a focused practice session with instant feedback.
          </p>
          <button className="btn btn--lg" onClick={handleCTA}>
            {user ? 'Start a Quiz' : 'Create Your Free Account'}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>© {new Date().getFullYear()} QuizCraft · Learn anything, anytime.</p>
        </div>
      </footer>
    </div>
  );
}

export default Landing;