import React, { useState } from "react";
import api from "../Api.js";
import { useNavigate } from "react-router-dom";
import Header from "../Header";
import "../../styles/authentication/Register.css";

function Register() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === "password") {
      validatePassword(value);
    }
  };

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

    if (!validatePassword(formData.password)) return;

    setLoading(true);
    try {
      const res = await api.post("/register/", formData);

      navigate("/register-success", {
        state: { message: res.data.message },
      });
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        "Email is already in use or the data entered is invalid";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const isSubmitDisabled = loading || !!passwordError;

  return (
    <div className="page-container">
      <Header />
      <main className="main">
        <div className="auth-card">
          <h2>Registration</h2>
          <form
            className="auth-form"
            autoComplete="on"
            onSubmit={handleSubmit}
            name="registerForm"
          >
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
              autoComplete="new-password"
            />
            {passwordError && <p className="error-message">{passwordError}</p>}

            <button type="submit" disabled={isSubmitDisabled}>
              {loading ? "Registering..." : "Sign up"}
            </button>

            {errorMessage && <p className="error-message">{errorMessage}</p>}
          </form>

          <p className="switch-text">
            Already have account?{" "}
            <span onClick={() => navigate("/login")}>Login</span>
          </p>

          <button className="link-btn" onClick={() => navigate("/")}>
            Homepage
          </button>
        </div>
      </main>
    </div>
  );
}

export default Register;
