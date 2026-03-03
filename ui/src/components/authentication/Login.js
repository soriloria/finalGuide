import React, { useState } from "react";
import api from "../Api.js";
import { useNavigate } from "react-router-dom";
import Header from "../Header";
import "../../styles/authentication/Login.css";

function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      const res = await api.post("/token/", formData);
      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);
      navigate("/");
    } catch (error) {
      if (error.response?.status === 401) {
        setErrorMessage("Incorrect credentials, or account not activated. Please check your email");
      } else {
        setErrorMessage("An error occurred. Please try again");
      }
    }
  };

  return (
    <div className="page-container">
      <Header />
      <main className="main">
        <div className="auth-card">
          <h2>Login to your account</h2>
          <form className="auth-form" onSubmit={handleSubmit}>
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
            <input
              name="password"
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              autoCorrect="off"
              autoCapitalize="off"
            />
            <button type="submit">Login</button>
            {errorMessage && (
              <p className="error-message">{errorMessage}</p>
            )}
          </form>

          <div className="link-btn-row">
          <button
              className="link-btn"
              onClick={() => navigate("/")}
            >
              Homepage
            </button>
            <button
              className="link-btn"
              onClick={() => navigate("/password-reset")}
            >
              Forgot your password?
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

export default Login;
