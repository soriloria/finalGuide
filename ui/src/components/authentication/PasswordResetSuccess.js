    import React from "react";
    import { useLocation, useNavigate } from "react-router-dom";
    import Header from "../Header";
    import "../../styles/authentication/RegisterSuccess.css";

    function PasswordResetSuccess() {
      const navigate = useNavigate();
      const location = useLocation();
      const message =
        location.state?.message ||
        "Password reset email sent. Please check your inbox";

      return (
        <div className="page-container">
          <Header />
          <main className="main">
            <div className="success-card">
              <h2>✅ Email sent!</h2>
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

    export default PasswordResetSuccess;
