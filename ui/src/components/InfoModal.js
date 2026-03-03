import React from "react";
import "../styles/InfoModal.css";

const InfoModal = ({ isOpen, onClose, onApp, onBrowser }) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="info-modal-overlay" onClick={handleOverlayClick}>
      <div className="info-modal-content">
        <button className="info-modal-close" onClick={onClose}>
          ×
        </button>

        <h2 className="info-modal-title">Open Map</h2>
        <p className="info-modal-message">Open google maps?</p>

        <div className="info-modal-button-wrapper">
          <button
            className="info-modal-confirm info-modal-cancel"
            onClick={onClose}
          >
            Cancel
          </button>

          <button className="info-modal-confirm" onClick={onApp}>
            Open
          </button>

        </div>
      </div>
    </div>
  );
};

export default InfoModal;
