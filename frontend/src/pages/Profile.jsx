import { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/ui/Alert';

function Profile() {
  const { user, updateUser } = useAuth();
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    grade: user?.profile?.grade || '',
    institution: user?.profile?.institution || '',
    bio: user?.profile?.bio || '',
  });
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwdErr, setPwdErr] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  const handleProfileChange = (e) => setProfileForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    setProfileErr('');
    setProfileLoading(true);
    try {
      const data = await api.patch('/api/auth/profile', profileForm);
      updateUser(data.user);
      setProfileMsg('Profile updated successfully.');
    } catch (err) {
      setProfileErr(err.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = (e) => setPasswordForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwdMsg('');
    setPwdErr('');
    if (passwordForm.newPassword.length < 6) {
      setPwdErr('New password must be at least 6 characters.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPwdErr('New passwords do not match.');
      return;
    }
    setPwdLoading(true);
    try {
      await api.patch('/api/auth/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPwdMsg('Password changed successfully.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwdErr(err.message || 'Failed to change password.');
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="animate-fade-up">
      <div className="page-header">
        <h1>My Profile</h1>
        <p className="text-muted">Manage your account information and security.</p>
      </div>

      <div className="grid grid--2">
        {/* Profile info */}
        <div className="card">
          <h3 style={{ marginBottom: '1.2rem' }}>Account Information</h3>
          <Alert type="success">{profileMsg}</Alert>
          <Alert type="error">{profileErr}</Alert>

          <form onSubmit={handleProfileSubmit}>
            <div className="form-group">
              <label htmlFor="name">Full name</label>
              <input id="name" name="name" className="input" value={profileForm.name} onChange={handleProfileChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="grade">Grade / Class</label>
              <input id="grade" name="grade" className="input" value={profileForm.grade} onChange={handleProfileChange} />
            </div>
            <div className="form-group">
              <label htmlFor="institution">Institution / School</label>
              <input id="institution" name="institution" className="input" value={profileForm.institution} onChange={handleProfileChange} />
            </div>
            <div className="form-group">
              <label htmlFor="bio">About me</label>
              <textarea id="bio" name="bio" className="textarea" value={profileForm.bio} onChange={handleProfileChange} placeholder="Tell us a little about yourself…" />
            </div>
            <button type="submit" className="btn" disabled={profileLoading}>
              {profileLoading ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Security */}
        <div className="card">
          <h3 style={{ marginBottom: '1.2rem' }}>Change Password</h3>
          <Alert type="success">{pwdMsg}</Alert>
          <Alert type="error">{pwdErr}</Alert>

          <form onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label htmlFor="currentPassword">Current password</label>
              <input id="currentPassword" name="currentPassword" type="password" className="input" value={passwordForm.currentPassword} onChange={handlePasswordChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="newPassword">New password</label>
              <input id="newPassword" name="newPassword" type="password" className="input" value={passwordForm.newPassword} onChange={handlePasswordChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm new password</label>
              <input id="confirmPassword" name="confirmPassword" type="password" className="input" value={passwordForm.confirmPassword} onChange={handlePasswordChange} required />
            </div>
            <button type="submit" className="btn btn--danger" disabled={pwdLoading}>
              {pwdLoading ? 'Updating…' : 'Update Password'}
            </button>
          </form>

          <div className="alert alert--info" style={{ marginTop: '1.5rem' }}>
            <strong>Account details</strong>
            <div style={{ marginTop: '0.4rem' }}>
              Email: <strong>{user?.email}</strong>
            </div>
            <div>
              Role: <strong style={{ textTransform: 'capitalize' }}>{user?.role}</strong>
            </div>
            <div>
              Member since: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;