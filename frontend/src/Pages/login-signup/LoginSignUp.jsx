// src/Pages/login-signup/LoginSignUp.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from 'react-redux';
import { fetchCustomerProfile } from '../../store/slices/customerProfileSlice';
import "./LoginSignUp.css";

const LoginSignUp = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("signin");
  const [userType, setUserType] = useState("customer");
  const [signinData, setSigninData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    dob: "",
    phone: "",
    companyName: "",
    contactPerson: "",
    aadharNumber: "",
    specialization: "",
    experience: "",
    password: "",
    confirmPassword: "",
    termsAccepted: false,
  });
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState("email");
  const [forgotEmail, setForgotEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [generatedOTP, setGeneratedOTP] = useState("");
  const [resendTimeoutId, setResendTimeoutId] = useState(null);
  const [forgotError, setForgotError] = useState("");
  const otpRefs = useRef([]);

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    if (hash === "signup" || hash === "signin") setActiveTab(hash);
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const res = await fetch("/api/session", { credentials: "include" });
      const data = await res.json();
      if (data.authenticated) {
        const role = data.user.role;
        if (role === "customer") navigate("/customerdashboard");
        else if (role === "company") navigate("/companydashboard");
        else if (role === "worker") navigate("/workerdashboard");
      }
    } catch (error) {
      console.error("Session check failed:", error);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setErrors({});
  };

  const handleUserTypeChange = (type) => {
    setUserType(type);
    setFiles([]);
    setErrors({});
  };

  const handleInputChange = (e, formType) => {
    const { id, value, type, checked } = e.target;
    if (formType === "signin") {
      setSigninData({ ...signinData, [id.replace("signin-", "")]: value });
    } else if (formType === "signup") {
      setSignupData({
        ...signupData,
        [id]: type === "checkbox" ? checked : value,
      });
    } else if (formType === "forgot") {
      if (id === "forgot-email") setForgotEmail(value);
      if (id === "new-password") setNewPassword(value);
      if (id === "confirm-new-password") setConfirmNewPassword(value);
    }
  };

  // file handlers with validation
  const MAX_FILES = 5;
  const MAX_FILE_MB = 5;
  const ALLOWED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png"];

  const validateFilesList = (list) => {
    if (!list || !list.length) return null;
    if (list.length > MAX_FILES) return `Maximum ${MAX_FILES} files allowed`;
    for (const f of list) {
      if (!ALLOWED_FILE_TYPES.includes(f.type))
        return `${f.name}: unsupported file type`;
      if (f.size > MAX_FILE_MB * 1024 * 1024)
        return `${f.name}: exceeds ${MAX_FILE_MB}MB`;
    }
    return null;
  };

  const handleFileChange = (e) => {
    const incoming = Array.from(e.target.files || []);
    const combined = [...files, ...incoming];
    const fileErr = validateFilesList(combined);
    if (fileErr) {
      setErrors((p) => ({ ...p, files: fileErr }));
      return;
    }
    setFiles(combined);
    setErrors((p) => ({ ...p, files: undefined }));
  };

  // Strict validators (trim inputs before validating)
  const validateName = (name) => {
    if (!name || String(name).trim().length === 0) return "Name required";
    const s = String(name).trim();
    if (s.length < 2 || s.length > 100)
      return "Name must be between 2 and 100 characters";
    if (!/\s+/.test(s))
      return "Please provide full name (first and last name)";
    if (!/^[A-Za-z][A-Za-z.'\-\s]+$/.test(s))
      return "Name contains invalid characters";
    return "";
  };

  const validateEmail = (email) => {
    if (!email || String(email).trim().length === 0) return "Email required";
    const s = String(email).trim();
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
    return re.test(s) ? "" : "Invalid email address";
  };

  const validatePhone = (phone) => {
    if (!phone || String(phone).trim().length === 0) return "Phone required";
    const s = String(phone).replace(/\D/g, "");
    return /^\d{10}$/.test(s) ? "" : "Enter a valid 10-digit phone number";
  };

  const validatePassword = (pw) => {
    if (!pw) return "Password required";
    // min 8 chars, one upper, one lower, one number, one special
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+=\-{}[\]|\\:;"'<,>.?/]).{8,}$/;
    return re.test(pw)
      ? ""
      : "Password must have min 8 chars, upper/lower/number/special";
  };

  const validateAadhar = (aadhar) => {
    if (!aadhar) return "Aadhar required";
    return /^\d{12}$/.test(String(aadhar).trim())
      ? ""
      : "Aadhar must be 12 digits";
  };

  const validateDOB = (dob) => {
    if (!dob) return "Date of birth required";
    const dobDate = new Date(dob);
    if (Number.isNaN(dobDate.getTime())) return "Invalid date";
    const minAge = new Date();
    minAge.setFullYear(minAge.getFullYear() - 18);
    return dobDate <= minAge ? "" : "You must be at least 18 years old";
  };

  const validateExperience = (exp) => {
    if (exp === "" || exp === null || exp === undefined) return "";
    return /^\d+$/.test(String(exp)) && parseInt(exp, 10) >= 0
      ? ""
      : "Invalid experience years";
  };

  const resetFieldErrors = (fields) => {
    setErrors((prev) => {
      const copy = { ...prev };
      fields.forEach((f) => delete copy[f]);
      return copy;
    });
  };

  // Validation for signin
  const validateSignin = () => {
    const newErrors = {};
    const email = String(signinData.email || "").trim();
    const pw = signinData.password || "";

    const e = validateEmail(email);
    if (e) newErrors["signin-email"] = e;
    const p = pw ? "" : "Password required";
    if (p) newErrors["signin-password"] = p;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validation for signup (strict)
  const validateSignup = () => {
    const newErrors = {};
    const name = String(signupData.name || "").trim();
    const email = String(signupData.email || "").trim();
    const phone = String(signupData.phone || "").trim();
    const password = signupData.password || "";
    const confirmPassword = signupData.confirmPassword || "";

    // common checks
    const emailErr = validateEmail(email);
    if (emailErr) newErrors.email = emailErr;

    const phoneErr = validatePhone(phone);
    if (phoneErr) newErrors.phone = phoneErr;

    const pwErr = validatePassword(password);
    if (pwErr) newErrors.password = pwErr;

    if (password !== confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    if (!signupData.termsAccepted)
      newErrors.terms = "Accept terms and conditions";

    // user-type specific
    if (userType === "customer" || userType === "worker") {
      const nameErr = validateName(name);
      if (nameErr) newErrors.name = nameErr;

      const dobErr = validateDOB(signupData.dob);
      if (dobErr) newErrors.dob = dobErr;
    }

    if (userType === "company") {
      if (!signupData.companyName || String(signupData.companyName).trim().length < 2)
        newErrors.companyName = "Company name required";
      const cp = String(signupData.contactPerson || "").trim();
      const cpErr = validateName(cp);
      if (cpErr) newErrors.contactPerson = cpErr;
    }

    if (userType === "worker") {
      const aErr = validateAadhar(signupData.aadharNumber || "");
      if (aErr) newErrors.aadharNumber = aErr;

      if (!signupData.specialization)
        newErrors.specialization = "Select specialization";

      const expErr = validateExperience(signupData.experience);
      if (expErr) newErrors.experience = expErr;
    }

    // files validation for company/worker
    if ((userType === "company" || userType === "worker") && files.length > 0) {
      const fErr = validateFilesList(files);
      if (fErr) newErrors.files = fErr;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSigninSubmit = async (e) => {
    e.preventDefault();
    if (!validateSignin()) return;
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: String(signinData.email || "").trim(),
          password: signinData.password,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        // Fetch and store customer profile in Redux
        dispatch(fetchCustomerProfile());
        navigate(data.redirect);
      } else setErrors({ general: data.message });
    } catch (err) {
      setErrors({ general: "Server error" });
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (!validateSignup()) return;

    const formData = new FormData();
    Object.keys(signupData).forEach((key) => {
      if (key !== "confirmPassword") formData.append(key, signupData[key]);
    });
    formData.append("role", userType);
    files.forEach((file) => formData.append("documents", file));

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) setActiveTab("signin");
      else setErrors({ general: data.message });
    } catch (err) {
      setErrors({ general: "Server error" });
    }
  };

  // Forgot Password
  const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

  const disableResend = () => {
    if (resendTimeoutId) clearInterval(resendTimeoutId);
    let count = 30;
    const id = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(id);
        setResendTimeoutId(null);
      }
    }, 1000);
    setResendTimeoutId(id);
  };

  const handleSendOTP = () => {
    const e = validateEmail(String(forgotEmail || "").trim());
    if (e) {
      setForgotError(e);
      return;
    }
    const otpCode = generateOTP();
    setGeneratedOTP(otpCode);
    console.log("OTP:", otpCode);
    setForgotStep("otp");
    disableResend();
    setForgotError("");
  };

  const handleVerifyOTP = () => {
    if (otp.join("") === generatedOTP) {
      setForgotError("");
      setForgotStep("password");
    } else {
      setForgotError("Invalid OTP");
      setOtp(["", "", "", ""]);
    }
  };

  const handleResendOTP = (e) => {
    e.preventDefault();
    if (resendTimeoutId) return;
    const otpCode = generateOTP();
    setGeneratedOTP(otpCode);
    console.log("Resent OTP:", otpCode);
    disableResend();
    setOtp(["", "", "", ""]);
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setForgotError("Passwords don't match");
      return;
    }
    const pErr = validatePassword(newPassword);
    if (pErr) {
      setForgotError(pErr);
      return;
    }
    // Call backend API to reset password here (omitted)
    setShowForgotModal(false);
    resetForgotForm();
    setActiveTab("signin");
  };

  const handleOtpChange = (i, val) => {
    if (val.length > 1) return;
    const newOtp = [...otp];
    newOtp[i] = val.replace(/\D/g, "");
    setOtp(newOtp);
    if (val && i < 3) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKeyDown = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
  };

  const resetForgotForm = () => {
    setForgotEmail("");
    setOtp(["", "", "", ""]);
    setNewPassword("");
    setConfirmNewPassword("");
    setGeneratedOTP("");
    if (resendTimeoutId) clearInterval(resendTimeoutId);
    setResendTimeoutId(null);
    setForgotError("");
    setForgotStep("email");
  };

  return (
    <div className="ls-landing-page">
      <div className="ls-admin-link">
        <Link to="/platform-manager-login" className="ls-admin-login-btn">
          Platform Manager
        </Link>
        <Link to="/admin-login" className="ls-admin-login-btn ls-admin-login-secondary">
          Admin
        </Link>
      </div>

      <div className="ls-main-container">
        <div className="ls-hero-content">
          <h1>Build & Beyond</h1>
          <p>
            Welcome to Build & Beyond, your ultimate platform for seamless
            construction project management. Connect customers, companies, and
            workers effortlessly.
          </p>
          <div className="ls-btn-container">
            <button
              onClick={() => handleTabChange("signup")}
              className="ls-btn ls-btn-primary"
            >
              Get Started
            </button>
            <button
              onClick={() => handleTabChange("signin")}
              className="ls-btn ls-btn-secondary"
            >
              Learn More
            </button>
          </div>
        </div>

        <div className="ls-auth-card">
          <div className="ls-auth-tabs">
            <button
              className={`ls-tab-button ${activeTab === "signin" ? "active" : ""
                }`}
              onClick={() => handleTabChange("signin")}
            >
              Sign In
            </button>
            <button
              className={`ls-tab-button ${activeTab === "signup" ? "active" : ""
                }`}
              onClick={() => handleTabChange("signup")}
            >
              Sign Up
            </button>
          </div>

          <div className="ls-auth-content">
            {/* SIGN IN */}
            {activeTab === "signin" && (
              <div className="form-content active">
                <form onSubmit={handleSigninSubmit}>
                  <div className="ls-form-header">
                    <h2>Welcome Back</h2>
                    <p>Please enter your details</p>
                  </div>

                  <div className="ls-form-group">
                    <label htmlFor="signin-email">Email</label>
                    <input
                      type="email"
                      id="signin-email"
                      className={`ls-form-input ${errors["signin-email"] ? "error" : ""
                        }`}
                      value={signinData.email}
                      onChange={(e) => handleInputChange(e, "signin")}
                      required
                    />
                    <div className="ls-error-message">
                      {errors["signin-email"]}
                    </div>
                  </div>

                  <div className="ls-form-group">
                    <label htmlFor="signin-password">Password</label>
                    <input
                      type="password"
                      id="signin-password"
                      className={`ls-form-input ${errors["signin-password"] ? "error" : ""
                        }`}
                      value={signinData.password}
                      onChange={(e) => handleInputChange(e, "signin")}
                      required
                    />
                    <div className="ls-error-message">
                      {errors["signin-password"]}
                    </div>
                  </div>

                  <div className="ls-form-options">
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowForgotModal(true);
                      }}
                    >
                      Forgot Password?
                    </a>
                  </div>

                  <button
                    type="submit"
                    className="ls-btn ls-btn-primary ls-w-100"
                  >
                    Sign In
                  </button>
                  {errors.general && (
                    <div className="ls-validation-error">{errors.general}</div>
                  )}
                </form>
              </div>
            )}

            {/* SIGN UP */}
            {activeTab === "signup" && (
              <div className="form-content active">
                <form onSubmit={handleSignupSubmit}>
                  <div className="form-header">
                    <h2>Create Account</h2>
                    <p>Join Build & Beyond today</p>
                  </div>

                  <div className="ls-user-type-selection">
                    <label>User Type</label>
                    <div className="ls-user-type-buttons">
                      {["customer", "company", "worker"].map((type) => (
                        <button
                          key={type}
                          type="button"
                          className={`ls-user-type-btn ${userType === type ? "active" : ""
                            }`}
                          onClick={() => handleUserTypeChange(type)}
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="ls-signup-columns">
                    <div className="signup-left">
                      {(userType === "customer" || userType === "worker") && (
                        <>
                          <div className="ls-form-group">
                            <label htmlFor="name">Name</label>
                            <input
                              type="text"
                              id="name"
                              className={`ls-form-input ${errors.name ? "error" : ""
                                }`}
                              value={signupData.name}
                              onChange={(e) => handleInputChange(e, "signup")}
                              required
                            />
                            <div className="ls-error-message">
                              {errors.name}
                            </div>
                          </div>
                        </>
                      )}

                      {userType === "company" && (
                        <>
                          <div className="ls-form-group">
                            <label htmlFor="companyName">Company Name</label>
                            <input
                              type="text"
                              id="companyName"
                              className={`ls-form-input ${errors.companyName ? "error" : ""
                                }`}
                              value={signupData.companyName}
                              onChange={(e) => handleInputChange(e, "signup")}
                              required
                            />
                            <div className="ls-error-message">
                              {errors.companyName}
                            </div>
                          </div>
                          <div className="ls-form-group">
                            <label htmlFor="contactPerson">
                              Contact Person
                            </label>
                            <input
                              type="text"
                              id="contactPerson"
                              className={`ls-form-input ${errors.contactPerson ? "error" : ""
                                }`}
                              value={signupData.contactPerson}
                              onChange={(e) => handleInputChange(e, "signup")}
                              required
                            />
                            <div className="ls-error-message">
                              {errors.contactPerson}
                            </div>
                          </div>
                        </>
                      )}

                      <div className="ls-form-group">
                        <label htmlFor="email">Email</label>
                        <input
                          type="email"
                          id="email"
                          className={`ls-form-input ${errors.email ? "error" : ""
                            }`}
                          value={signupData.email}
                          onChange={(e) => handleInputChange(e, "signup")}
                          required
                        />
                        <div className="ls-error-message">{errors.email}</div>
                      </div>
                    </div>

                    <div className="signup-right">
                      {(userType === "customer" || userType === "worker") && (
                        <div className="ls-form-group">
                          <label htmlFor="dob">Date of Birth</label>
                          <input
                            type="date"
                            id="dob"
                            className={`ls-form-input ${errors.dob ? "error" : ""
                              }`}
                            value={signupData.dob}
                            onChange={(e) => handleInputChange(e, "signup")}
                            required
                          />
                          <div className="ls-error-message">{errors.dob}</div>
                        </div>
                      )}

                      <div className="ls-form-group">
                        <label htmlFor="phone">Phone</label>
                        <input
                          type="tel"
                          id="phone"
                          className={`ls-form-input ${errors.phone ? "error" : ""
                            }`}
                          value={signupData.phone}
                          onChange={(e) => handleInputChange(e, "signup")}
                          required
                        />
                        <div className="ls-error-message">{errors.phone}</div>
                      </div>

                      {userType === "worker" && (
                        <>
                          <div className="ls-worker-details">
                            <div className="ls-form-group">
                              <label htmlFor="aadharNumber">Aadhar Number</label>
                              <input
                                type="text"
                                id="aadharNumber"
                                className={`ls-form-input ${errors.aadharNumber ? "error" : ""
                                  }`}
                                value={signupData.aadharNumber}
                                onChange={(e) => handleInputChange(e, "signup")}
                                required
                              />
                              <div className="ls-error-message">
                                {errors.aadharNumber}
                              </div>
                            </div>
                            <div className="ls-form-group">
                              <label htmlFor="specialization">
                                Specialization
                              </label>
                              <select
                                id="specialization"
                                className={`ls-form-input ls-select ${errors.specialization ? "error" : ""
                                  }`}
                                value={signupData.specialization}
                                onChange={(e) => handleInputChange(e, "signup")}
                                required
                              >
                                <option value="">Select Specialization</option>
                                <option value="architect">Architect</option>
                                <option value="interiordesign">
                                  Interior Design
                                </option>
                              </select>
                              <div className="ls-error-message">
                                {errors.specialization}
                              </div>
                            </div>
                            <div className="ls-form-group">
                              <label htmlFor="experience">
                                Experience (years)
                              </label>
                              <input
                                type="number"
                                id="experience"
                                className={`ls-form-input ${errors.experience ? "error" : ""
                                  }`}
                                value={signupData.experience}
                                onChange={(e) => handleInputChange(e, "signup")}
                                min="0"
                              />
                              <div className="ls-error-message">
                                {errors.experience}
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="ls-password-section">
                    <div className="ls-form-group">
                      <label htmlFor="password">Password</label>
                      <input
                        type="password"
                        id="password"
                        className={`ls-form-input ${errors.password ? "error" : ""
                          }`}
                        value={signupData.password}
                        onChange={(e) => handleInputChange(e, "signup")}
                        required
                      />
                      <div className="ls-error-message">{errors.password}</div>
                    </div>
                    <div className="ls-form-group">
                      <label htmlFor="confirmPassword">Confirm Password</label>
                      <input
                        type="password"
                        id="confirmPassword"
                        className={`ls-form-input ${errors.confirmPassword ? "error" : ""
                          }`}
                        value={signupData.confirmPassword}
                        onChange={(e) => handleInputChange(e, "signup")}
                        required
                      />
                      <div className="ls-error-message">
                        {errors.confirmPassword}
                      </div>
                    </div>
                  </div>

                  {(userType === "company" || userType === "worker") && (
                    <div className="ls-file-upload-container">
                      <label>
                        {userType === "company"
                          ? "Company Documents"
                          : "Certificates"}
                      </label>
                      <input type="file" multiple onChange={handleFileChange} />
                      <div className="ls-file-list">
                        {files.map((f, i) => (
                          <div key={i}>{f.name}</div>
                        ))}
                      </div>
                      <div className="ls-error-message">{errors.files}</div>
                    </div>
                  )}

                  {/* FIXED CHECKBOX */}
                  <div className="ls-terms-section">
                    <label
                      className="ls-checkbox-container"
                      htmlFor="signup-terms"
                    >
                      <input
                        type="checkbox"
                        id="signup-terms"
                        checked={signupData.termsAccepted}
                        onChange={(e) =>
                          setSignupData({
                            ...signupData,
                            termsAccepted: e.target.checked,
                          })
                        }
                      />
                      <span>I accept the terms and conditions</span>
                    </label>
                    <div className="ls-validation-error">{errors.terms}</div>
                  </div>

                  <button
                    type="submit"
                    className="ls-btn ls-btn-primary ls-w-100"
                  >
                    Sign Up
                  </button>
                  {errors.general && (
                    <div className="ls-validation-error">{errors.general}</div>
                  )}
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div
          className="ls-modal"
          onClick={() => {
            setShowForgotModal(false);
            resetForgotForm();
          }}
        >
          <div
            className="ls-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <span
              className="ls-close"
              onClick={() => {
                setShowForgotModal(false);
                resetForgotForm();
              }}
            >
              ×
            </span>

            <form onSubmit={handleResetPassword}>
              {forgotStep === "email" && (
                <div id="email-step">
                  <h2>Reset Password</h2>
                  <div className="ls-form-group">
                    <label htmlFor="forgot-email">Email</label>
                    <input
                      type="email"
                      id="forgot-email"
                      value={forgotEmail}
                      onChange={(e) => handleInputChange(e, "forgot")}
                      required
                    />
                  </div>
                  <button type="button" onClick={handleSendOTP}>
                    Send OTP
                  </button>
                </div>
              )}

              {forgotStep === "otp" && (
                <div id="otp-step">
                  <h2>Enter OTP</h2>
                  <div className="ls-otp-container">
                    {otp.map((d, i) => (
                      <input
                        key={i}
                        type="text"
                        maxLength="1"
                        className="ls-otp-input"
                        value={d}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        ref={(el) => (otpRefs.current[i] = el)}
                      />
                    ))}
                  </div>
                  <button type="button" onClick={handleVerifyOTP}>
                    Verify
                  </button>
                  <a
                    href="#"
                    onClick={handleResendOTP}
                    className={resendTimeoutId ? "ls-disabled" : ""}
                  >
                    {resendTimeoutId ? "Resend Code (30s)" : "Resend Code"}
                  </a>
                </div>
              )}

              {forgotStep === "password" && (
                <div id="password-step">
                  <h2>Set New Password</h2>
                  <div className="ls-form-group">
                    <label htmlFor="new-password">New Password</label>
                    <input
                      type="password"
                      id="new-password"
                      value={newPassword}
                      onChange={(e) => handleInputChange(e, "forgot")}
                      required
                    />
                  </div>
                  <div className="ls-form-group">
                    <label htmlFor="confirm-new-password">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      id="confirm-new-password"
                      value={confirmNewPassword}
                      onChange={(e) => handleInputChange(e, "forgot")}
                      required
                    />
                  </div>
                  <button type="submit">Reset Password</button>
                </div>
              )}
              {forgotError && (
                <div className="ls-validation-error">{forgotError}</div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginSignUp;
