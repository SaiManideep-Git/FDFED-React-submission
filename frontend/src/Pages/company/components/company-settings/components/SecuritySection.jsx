import React, { useState } from "react";

export default function SecuritySection() {
  const [securityForm, setSecurityForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  function handleSecurityChange(e) {
    const { name, value } = e.target;
    setSecurityForm((prev) => ({ ...prev, [name]: value }));
  }

  function submitSecurity(e) {
    e.preventDefault();
    if (!securityForm.currentPassword) {
      alert("Enter current password");
      return;
    }
    if (!securityForm.newPassword || securityForm.newPassword.length < 8) {
      alert("New password must be at least 8 characters");
      return;
    }
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    // In production, call your API endpoint to change password.
    alert("Password changed (demo). Implement backend call.");
    setSecurityForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
  }

  return (
    <section className="cs-section cs-active">
      <h2 className="cs-section-title">Security Settings</h2>
      <form className="cs-form" onSubmit={submitSecurity}>
        <div className="cs-form-row">
          <label>Current Password</label>
          <input
            type="password"
            name="currentPassword"
            className="cs-input"
            value={securityForm.currentPassword}
            onChange={handleSecurityChange}
            required
          />
        </div>
        <div className="cs-form-row">
          <label>New Password</label>
          <input
            type="password"
            name="newPassword"
            className="cs-input"
            value={securityForm.newPassword}
            onChange={handleSecurityChange}
            required
          />
        </div>
        <div className="cs-form-row">
          <label>Confirm New Password</label>
          <input
            type="password"
            name="confirmPassword"
            className="cs-input"
            value={securityForm.confirmPassword}
            onChange={handleSecurityChange}
            required
          />
        </div>
        <div className="cs-actions">
          <button type="submit" className="cs-btn-primary">
            Update Password
          </button>
        </div>
      </form>
    </section>
  );
}
