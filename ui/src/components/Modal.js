import React from "react";
import { createPortal } from "react-dom";
import "../styles/Modal.css";

const Modal = ({
  isOpen,
  onClose,
  title,
  message,
  onConfirm,
  confirmText = "OK",
  cancelText = "Cancel"
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return createPortal(
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>×</button>

        {title && <h2 className="modal-title">{title}</h2>}
        {message && <div className="modal-message">{message}</div>}

        <div className="modal-buttons">
          <button className="modal-cancel" onClick={onClose}>
            {cancelText}
          </button>
          <button className="modal-confirm" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
