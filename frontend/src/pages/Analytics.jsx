import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import Alert from '../components/ui/Alert';
import EmptyState from '../components/ui/EmptyState';
import LoadingScreen from '../components/ui/LoadingScreen';

const CHART_COLORS = ['#5F9EA0', '#B0E0E6', '#2C3E50', '#7a8ea0', '#d99a3d'];

function Analytics() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [topics, setTopics] = useState([]);
  const [weakTopics, setWeakTopics] = useState([]);
  const [strongTopics, setStrongTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    Promise.all([
      api.get('/api/analytics/summary'),
      api.get('/api/analytics/timeline'),
      api.get('/api/analytics/topics'),
    ])
      .then(([s, t, tp]) => {
        if (!mounted) return;
        setSummary(s.analytics);
        setTimeline(t.timeline);
        setTopics(tp.topics);
        setWeakTopics(tp.weakTopics || []);
        setStrongTopics(tp.strongTopics || []);
      })
      .catch((err) => {
        if (mounted) setError(err.message || 'Failed to load analytics.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <LoadingScreen label="Building your analytics…" />;

  const s = summary?.summary;

  const topicChartData = topics.map((t) => ({
    name: t.topic,
    average: t.averagePercentage,
    best: t.bestScore,
  }));

  const passFailData = [
    { name: 'Passed', value: s?.totalPassed || 0 },
    { name: 'Failed', value: s?.totalFailed || 0 },
  ];

  return (
    <div className="animate-fade-up">
      <div className="page-header">
        <h1>Performance Analytics</h1>
        <p className="text-muted">Visualize your progress and preparation across all your quizzes.</p>
      </div>

      <Alert type="error">{error}</Alert>

      {summary && !summary.hasEnoughData && (
        <Alert type="info">{summary.message}</Alert>
      )}

      {/* Summary stat cards */}
      <div className="grid grid--4 stagger" style={{ marginBottom: '2rem' }}>
        <StatCard icon="🎯" label="Overall Prep" value={s ? `${s.overallPreparation}%` : '—'} />
        <StatCard icon="📝" label="Attempts" value={s ? s.totalAttempts : 0} />
        <StatCard icon="⭐" label="Avg Score" value={s ? `${s.averagePercentage}%` : '—'} />
        <StatCard icon="🏆" label="Highest" value={s ? `${s.highestScore}%` : '—'} />
      </div>

      {/* Timeline chart */}
      <div className="chart-box" style={{ marginBottom: '2rem' }}>
        <h3>Score Progression</h3>
        {timeline.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeline.map((t, i) => ({ ...t, attempt: `#${i + 1}` }))} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EAF7F8" />
              <XAxis dataKey="attempt" tick={{ fontSize: 12, fill: '#7a8ea0' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#7a8ea0' }} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #B0E0E6', fontFamily: 'inherit' }}
                formatter={(value, _name, props) => [`${value}%`, props.payload.topic]}
              />
              <Line type="monotone" dataKey="percentage" name="Score %" stroke="#5F9EA0" strokeWidth={3} dot={{ r: 4, fill: '#5F9EA0' }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState icon="📈" title="No data yet" message="Complete quizzes to see your score progression." />
        )}
      </div>

      <div className="grid grid--2" style={{ marginBottom: '2rem' }}>
        {/* Topic performance */}
        <div className="chart-box">
          <h3>Performance by Topic</h3>
          {topicChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topicChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAF7F8" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#7a8ea0' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#7a8ea0' }} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #B0E0E6', fontFamily: 'inherit' }}
                  formatter={(value) => [`${value}%`, 'Average']}
                />
                <Bar dataKey="average" radius={[6, 6, 0, 0]}>
                  {topicChartData.map((entry, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon="🧩" title="No topics yet" message="Your topic performance chart will appear after quizzes." />
          )}
        </div>

        {/* Pass/Fail */}
        <div className="chart-box">
          <h3>Pass / Fail Distribution</h3>
          {s && s.totalAttempts > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={passFailData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  <Cell fill="#2e9e6b" />
                  <Cell fill="#d15b5b" />
                </Pie>
                <Legend />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #B0E0E6', fontFamily: 'inherit' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon="🎯" title="No assessments yet" message="Take a quiz to see your pass/fail breakdown." />
          )}
        </div>
      </div>

      {/* Weak & strong topics */}
      <div className="grid grid--2" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>⚠️ Weak Topics</h3>
          {weakTopics.length ? (
            <div className="stagger">
              {weakTopics.map((t) => (
                <div key={t.topic} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--powder-light)' }}>
                  <strong>{t.topic}</strong>
                  <Badge type="danger">{t.averagePercentage}% avg</Badge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="💪" title="No weak topics" message="Nothing below 70% — keep it up!" />
          )}
        </div>
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>💚 Strong Topics</h3>
          {strongTopics.length ? (
            <div className="stagger">
              {strongTopics.map((t) => (
                <div key={t.topic} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--powder-light)' }}>
                  <strong>{t.topic}</strong>
                  <Badge type="success">{t.averagePercentage}% avg</Badge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="🌱" title="No strong topics yet" message="Strong topics appear at 80% or above." />
          )}
        </div>
      </div>

      {/* Recommendations */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>💡 Recommendations</h3>
        {summary?.recommendations?.length ? (
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {summary.recommendations.map((r, i) => (
              <li key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                <span>💡</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon="✨" title="All caught up" message="Take quizzes to receive personalized recommendations." />
        )}
      </div>
    </div>
  );
}

export default Analytics;