import { useEffect, useState } from 'react';
import { api } from '../services/api';
import Alert from '../components/ui/Alert';
import Badge from '../components/ui/Badge';
import StatCard from '../components/ui/StatCard';
import LoadingScreen from '../components/ui/LoadingScreen';
import Modal from '../components/ui/Modal';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function Admin() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [settingsForm, setSettingsForm] = useState({});
  const [settingsMsg, setSettingsMsg] = useState('');
  const [settingsErr, setSettingsErr] = useState('');

  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({ role: '', isActive: true });

  useEffect(() => {
    let mounted = true;
    Promise.all([api.get('/api/admin/stats'), api.get('/api/admin/users?limit=50'), api.get('/api/admin/settings')])
      .then(([s, u, st]) => {
        if (!mounted) return;
        setStats(s.stats);
        setUsers(u.users);
        setSettings(st.settings);
        setSettingsForm({
          passingPercentage: st.settings.passingPercentage,
          defaultTimerMinutes: st.settings.defaultTimerMinutes,
          allowPracticeMode: st.settings.allowPracticeMode,
          quizGenerationRateLimit: st.settings.quizGenerationRateLimit,
        });
      })
      .catch((err) => {
        if (mounted) setError(err.message || 'Failed to load admin data.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <LoadingScreen label="Loading admin panel…" />;

  const handleSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettingsForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    setSettingsMsg('');
    setSettingsErr('');
    try {
      const data = await api.patch('/api/admin/settings', {
        passingPercentage: Number(settingsForm.passingPercentage),
        defaultTimerMinutes: Number(settingsForm.defaultTimerMinutes),
        allowPracticeMode: Boolean(settingsForm.allowPracticeMode),
        quizGenerationRateLimit: Number(settingsForm.quizGenerationRateLimit),
      });
      setSettings(data.settings);
      setSettingsMsg('Settings saved successfully.');
    } catch (err) {
      setSettingsErr(err.message || 'Failed to save settings.');
    }
  };

  const openEditUser = (user) => {
    setEditUser(user);
    setEditForm({ role: user.role, isActive: user.isActive });
  };

  const saveUser = async () => {
    try {
      await api.patch(`/api/admin/users/${editUser.id}`, editForm);
      setUsers((prev) => prev.map((u) => (u.id === editUser.id ? { ...u, ...editForm } : u)));
      setEditUser(null);
    } catch (err) {
      setError(err.message || 'Failed to update user.');
    }
  };

  return (
    <div className="animate-fade-up">
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p className="text-muted">Platform overview, user management, and assessment settings.</p>
      </div>

      <Alert type="error">{error}</Alert>

      {/* Platform stats */}
      {stats && (
        <div className="grid grid--4 stagger" style={{ marginBottom: '2rem' }}>
          <StatCard icon="👥" label="Total Users" value={stats.totalUsers} sub={`${stats.totalStudents} students`} />
          <StatCard icon="📝" label="Quizzes" value={stats.totalQuizzes} />
          <StatCard icon="✅" label="Attempts" value={stats.totalAttempts} sub={`${stats.passCount} passed`} />
          <StatCard icon="📊" label="Avg Score" value={`${stats.averagePercentage}%`} />
        </div>
      )}

      {/* Recent activity */}
      {stats && (
        <div className="grid grid--2" style={{ marginBottom: '2rem' }}>
          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>Recent Users</h3>
            {stats.recentUsers.length ? (
              <div className="stagger">
                {stats.recentUsers.map((u) => (
                  <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--powder-light)' }}>
                    <div>
                      <strong>{u.name}</strong>
                      <div className="text-small text-muted">{u.email}</div>
                    </div>
                    <Badge type={u.role === 'admin' ? 'cadet' : 'slate'}>{u.role}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted text-small">No users yet.</p>
            )}
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>Recent Attempts</h3>
            {stats.recentAttempts.length ? (
              <div className="stagger">
                {stats.recentAttempts.map((a) => (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--powder-light)' }}>
                    <div>
                      <strong>{a.title}</strong>
                      <div className="text-small text-muted">{a.userName} · {formatDate(a.completionDate)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <strong>{Math.round(a.percentage)}%</strong>
                      <Badge type={a.passed ? 'success' : 'danger'}>{a.passed ? 'PASS' : 'FAIL'}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted text-small">No attempts yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Settings */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1.2rem' }}>Assessment Settings</h3>
        <Alert type="success">{settingsMsg}</Alert>
        <Alert type="error">{settingsErr}</Alert>

        <form onSubmit={saveSettings} className="grid grid--2">
          <div className="form-group">
            <label htmlFor="passingPercentage">Passing percentage (%)</label>
            <input
              id="passingPercentage"
              name="passingPercentage"
              type="number"
              min="0"
              max="100"
              className="input"
              value={settingsForm.passingPercentage ?? 50}
              onChange={handleSettingsChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="defaultTimerMinutes">Default timer (minutes)</label>
            <input
              id="defaultTimerMinutes"
              name="defaultTimerMinutes"
              type="number"
              min="1"
              max="180"
              className="input"
              value={settingsForm.defaultTimerMinutes ?? 10}
              onChange={handleSettingsChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="quizGenerationRateLimit">Quiz generation limit (per hour)</label>
            <input
              id="quizGenerationRateLimit"
              name="quizGenerationRateLimit"
              type="number"
              min="1"
              className="input"
              value={settingsForm.quizGenerationRateLimit ?? 10}
              onChange={handleSettingsChange}
              required
            />
          </div>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <input
                type="checkbox"
                name="allowPracticeMode"
                checked={Boolean(settingsForm.allowPracticeMode)}
                onChange={handleSettingsChange}
                style={{ width: '18px', height: '18px' }}
              />
              Allow Practice Mode
            </label>
          </div>
          <div>
            <button type="submit" className="btn">Save Settings</button>
          </div>
        </form>
      </div>

      {/* Users table */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Registered Users ({users.length})</h3>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td><strong>{u.name}</strong></td>
                  <td>{u.email}</td>
                  <td><Badge type={u.role === 'admin' ? 'cadet' : 'slate'}>{u.role}</Badge></td>
                  <td>
                    <Badge type={u.isActive ? 'success' : 'danger'}>{u.isActive ? 'Active' : 'Disabled'}</Badge>
                  </td>
                  <td className="text-small text-muted">{formatDate(u.createdAt)}</td>
                  <td>
                    <button className="btn btn--outline btn--sm" onClick={() => openEditUser(u)}>Manage</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit user modal */}
      {editUser && (
        <Modal
          title={`Manage user: ${editUser.name}`}
          onClose={() => setEditUser(null)}
          footer={
            <>
              <button className="btn btn--outline" onClick={() => setEditUser(null)}>Cancel</button>
              <button className="btn" onClick={saveUser}>Save</button>
            </>
          }
        >
          <div className="form-group">
            <label htmlFor="editRole">Role</label>
            <select
              id="editRole"
              className="select"
              value={editForm.role}
              onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
            >
              <option value="student">Student</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <input
                type="checkbox"
                checked={editForm.isActive}
                onChange={(e) => setEditForm((f) => ({ ...f, isActive: e.target.checked }))}
                style={{ width: '18px', height: '18px' }}
              />
              Account active
            </label>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default Admin;