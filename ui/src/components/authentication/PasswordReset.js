import React, { useState } from "react";
import api from "../Api";
import { useNavigate } from "react-router-dom";
import Header from "../Header";
import "../../styles/authentication/Login.css";

function PasswordReset() {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      const res = await api.post("/password-reset/", { email });
      navigate("/password-reset-success", { state: { message: res.data.message } });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Error sending email";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <Header />
      <main className="main">
        <div className="auth-card">
          <h2>Password reset</h2>
          <form className="auth-form" onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send"}
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

export default PasswordReset;
