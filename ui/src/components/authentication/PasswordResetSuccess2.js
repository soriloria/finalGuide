import React from "react";
import { useNavigate } from "react-router-dom";
import Header from "../Header";
import "../../styles/authentication/RegisterSuccess.css";

function PasswordChangedSuccess2() {
  const navigate = useNavigate();

  return (
    <div className="page-container">
      <Header />
      <main className="main">
        <div className="success-card">
          <h2>✅ Password changed!</h2>
          <p>Password changed! You can login now</p>
          <button className="home-btn" onClick={() => navigate("/")}>
            Homepage
          </button>
        </div>
      </main>
    </div>
  );
}

export default PasswordChangedSuccess2;
