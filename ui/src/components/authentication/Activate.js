import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../Api";
import Header from "../Header";
import "../../styles/authentication/Login.css";

function Activate() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("Activating account...");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const activateAccount = async () => {
      try {
        const res = await api.get(`/activate/${token}/`);
        setMessage(res.data.message || "Account activated!");
        setSuccess(true);
      } catch (err) {
        setMessage("The link is expired or invalid.");
        setSuccess(false);
      }
    };

    activateAccount();
  }, [token]);

  return (
    <div className="page-container">
      <Header />
      <main className="main">
        <div className="auth-card">
          <h2>{success ? "✅ Activation successful!" : "❌ Activation failed"}</h2>
          <p className='MSG'>{message}</p>

          <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "20px" }}>
            {success && (
              <button
                className="auth-form-button"
                style={{
                  padding: "9px",
                  borderRadius: "50px",
                  fontSize: "16px",
                  backgroundColor: "#2563eb",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  transition: "transform 0.2s, background-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#1d4ed8";
                  e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#2563eb";
                  e.currentTarget.style.transform = "scale(1)";
                }}
                onClick={() => navigate("/login")}
              >
                Login
              </button>
            )}

            <button
              className="link-btn"
              style={{ fontSize: "16px", textDecoration: "underline" }}
              onClick={() => navigate("/")}
            >
             Homepage
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Activate;
