import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../Header";
import "../../styles/authentication/RegisterSuccess.css";

function RegisterSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const message =
    location.state?.message ||
    "You have successfully registered! Please check your email to confirm your account";

  return (
    <div className="page-container">
      <Header />
      <main className="main">
        <div className="success-card">
          <h2>✅ Registration successful!</h2>
          <p>{message}</p>
          <p className="note">
            If you don’t see the email in your inbox, please check your Spam folder
          </p>
          <button className="home-btn" onClick={() => navigate("/")}>
            Homepage
          </button>
        </div>
      </main>
    </div>
  );
}

export default RegisterSuccess;
