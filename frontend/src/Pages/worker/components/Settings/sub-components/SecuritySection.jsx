import React from 'react';
import './SecuritySection.css';

const SecuritySection = ({ passwordForm, onPasswordChange, onSubmit }) => {
  return (
    <div className="wkst-settings-section">
      <h2>Security Settings</h2>
      <p>Change your password to keep your account secure</p>

      <form onSubmit={onSubmit} className="wkst-password-form">
        <div className="wkst-form-group">
          <label htmlFor="currentPassword">Current Password</label>
          <input
            type="password"
            id="currentPassword"
            name="currentPassword"
            value={passwordForm.currentPassword}
            onChange={onPasswordChange}
            required
          />
        </div>

        <div className="wkst-form-group">
          <label htmlFor="newPassword">New Password</label>
          <input
            type="password"
            id="newPassword"
            name="newPassword"
            value={passwordForm.newPassword}
            onChange={onPasswordChange}
            required
            minLength="6"
          />
        </div>

        <div className="wkst-form-group">
          <label htmlFor="confirmPassword">Confirm New Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={passwordForm.confirmPassword}
            onChange={onPasswordChange}
            required
            minLength="6"
          />
        </div>

        <button type="submit" className="wkst-btn wkst-btn-primary">
          Update Password
        </button>
      </form>
    </div>
  );
};

export default SecuritySection;
