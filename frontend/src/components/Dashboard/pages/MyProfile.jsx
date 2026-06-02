import { useState, useEffect } from 'react';
import './MyProfile.scss';
import apiService from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

const ROLE_LABEL = {
  company_admin: 'Owner',
  support_agent: 'Support Agent',
  super_admin:   'Super Admin',
};

const MyProfile = () => {
  const { user, updateUser } = useAuth();

  // Profile form
  const [profile, setProfile] = useState({ firstName: '', lastName: '', email: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg]       = useState(null); // { type: 'ok'|'err', text }

  // Password form
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdMsg, setPwdMsg]       = useState(null);

  // Seed form from auth context (already fetched on app load)
  useEffect(() => {
    if (user) {
      setProfile({
        firstName: user.firstName || '',
        lastName:  user.lastName  || '',
        email:     user.email     || '',
      });
    }
  }, [user]);

  const setP = (k, v) => setProfile(prev => ({ ...prev, [k]: v }));
  const setPw = (k, v) => setPwd(prev => ({ ...prev, [k]: v }));

  const saveProfile = async () => {
    try {
      setSavingProfile(true);
      setProfileMsg(null);
      const res = await apiService.updateProfile({
        firstName: profile.firstName,
        lastName:  profile.lastName,
      });
      if (res.success) {
        updateUser(res.data.user);
        setProfileMsg({ type: 'ok', text: 'Profile saved.' });
      }
    } catch (e) {
      setProfileMsg({ type: 'err', text: e.message });
    } finally {
      setSavingProfile(false);
      setTimeout(() => setProfileMsg(null), 3000);
    }
  };

  const savePassword = async () => {
    if (pwd.newPassword !== pwd.confirmPassword) {
      setPwdMsg({ type: 'err', text: 'New passwords do not match.' });
      return;
    }
    if (pwd.newPassword.length < 8) {
      setPwdMsg({ type: 'err', text: 'Password must be at least 8 characters.' });
      return;
    }
    try {
      setSavingPwd(true);
      setPwdMsg(null);
      await apiService.updatePassword({
        currentPassword: pwd.currentPassword,
        newPassword:     pwd.newPassword,
      });
      setPwd({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPwdMsg({ type: 'ok', text: 'Password updated.' });
    } catch (e) {
      setPwdMsg({ type: 'err', text: e.message });
    } finally {
      setSavingPwd(false);
      setTimeout(() => setPwdMsg(null), 3000);
    }
  };

  const initials = `${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}`.toUpperCase() || '?';
  const fullName = `${profile.firstName} ${profile.lastName}`.trim() || 'User';
  const roleLabel = ROLE_LABEL[user?.role] || user?.role || '—';

  return (
    <div className="db-page myprofile">
      <div className="db-page__header">
        <h1 className="db-page__title">My Profile</h1>
        <p className="db-page__sub">Manage your account settings.</p>
      </div>

      <div className="two-col">
        {/* Left — profile info */}
        <div className="db-card">
          <div className="myprofile__avatar-row">
            <div className="myprofile__avatar">{initials}</div>
            <div>
              <div className="myprofile__name">{fullName}</div>
              <div className="myprofile__role">{roleLabel}</div>
            </div>
          </div>

          <div className="myprofile__divider" />

          <div className="myprofile__field">
            <label>First Name</label>
            <input
              className="db-input"
              value={profile.firstName}
              onChange={e => setP('firstName', e.target.value)}
            />
          </div>

          <div className="myprofile__field">
            <label>Last Name</label>
            <input
              className="db-input"
              value={profile.lastName}
              onChange={e => setP('lastName', e.target.value)}
            />
          </div>

          <div className="myprofile__field">
            <label>Email</label>
            <input
              className="db-input"
              value={profile.email}
              readOnly
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
              title="Email cannot be changed"
            />
          </div>

          <div className="myprofile__field">
            <label>Role</label>
            <div className="myprofile__readonly-field">{roleLabel}</div>
          </div>

          {profileMsg && (
            <div className={`myprofile__msg myprofile__msg--${profileMsg.type}`}>
              {profileMsg.text}
            </div>
          )}

          <button
            className="db-btn db-btn--primary"
            onClick={saveProfile}
            disabled={savingProfile}
          >
            {savingProfile ? 'Saving…' : 'Save Profile'}
          </button>
        </div>

        {/* Right — password */}
        <div className="db-card">
          <div className="myprofile__section-title">Change Password</div>

          <div className="myprofile__field">
            <label>Current Password</label>
            <input
              type="password"
              className="db-input"
              placeholder="••••••••"
              value={pwd.currentPassword}
              onChange={e => setPw('currentPassword', e.target.value)}
            />
          </div>

          <div className="myprofile__field">
            <label>New Password</label>
            <input
              type="password"
              className="db-input"
              placeholder="••••••••"
              value={pwd.newPassword}
              onChange={e => setPw('newPassword', e.target.value)}
            />
          </div>

          <div className="myprofile__field">
            <label>Confirm New Password</label>
            <input
              type="password"
              className="db-input"
              placeholder="••••••••"
              value={pwd.confirmPassword}
              onChange={e => setPw('confirmPassword', e.target.value)}
            />
          </div>

          {pwdMsg && (
            <div className={`myprofile__msg myprofile__msg--${pwdMsg.type}`}>
              {pwdMsg.text}
            </div>
          )}

          <button
            className="db-btn db-btn--ghost"
            onClick={savePassword}
            disabled={savingPwd || !pwd.currentPassword || !pwd.newPassword}
          >
            {savingPwd ? 'Updating…' : 'Update Password'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
