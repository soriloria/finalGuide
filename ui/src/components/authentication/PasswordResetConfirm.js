import React, { useState } from "react";
import api from "../Api";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../Header";
import "../../styles/authentication/Login.css";

function PasswordResetConfirm() {
  const { uid, token } = useParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validatePassword = (password) => {
    let message = "";
    if (password.length < 8) {
      message = "Password must be at least 8 characters long";
    } else if (!/[A-Z]/.test(password)) {
      message = "Password must contain at least one uppercase letter";
    } else if (!/[0-9]/.test(password)) {
      message = "Password must contain at least one number";
    } else if (!/[!@#$%^&*(),.?":{}|<>-]/.test(password)) {
      message = "Password must contain at least one special character";
    }

    setPasswordError(message);
    return message === "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!validatePassword(newPassword)) return;

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await api.post("/password-reset-confirm/", {
        uidb64: uid,
        token,
        new_password: newPassword,
      });


      navigate("/password-changed-success");
    } catch (err) {
      setErrorMessage("The link is invalid or has expired");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <Header />
      <main className="main">
        <div className="auth-card">
          <h2>Password change</h2>
          <form className="auth-form" onSubmit={handleSubmit}>
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                validatePassword(e.target.value);
              }}
              required
              autoComplete="new-password"
            />
            {passwordError && <p className="error-message">{passwordError}</p>}

            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />

            <button type="submit" disabled={loading || !!passwordError}>
              {loading ? "Sending..." : "Change password"}
            </button>

            {errorMessage && <p className="error-message">{errorMessage}</p>}
          </form>

          <div className="link-btn-row">
            <button className="link-btn" onClick={() => navigate("/")}>
              Homepage
            </button>
            <button className="link-btn" onClick={() => navigate("/login")}>
              Login
            </button>
          </div>

          <p className="switch-text">
            Don’t have an account?{" "}
            <span onClick={() => navigate("/register")}>Sign up</span>
          </p>
        </div>
      </main>
    </div>
  );
}

export default PasswordResetConfirm;
