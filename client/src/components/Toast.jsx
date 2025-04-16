import React from 'react';
import './Toast.css'; // Assuming your styling is in Sales.css or move it here

const Toast = ({ message, fadingOut }) => {
  if (!message) return null;

  return (
    <div className={`toast-message ${fadingOut ? 'fade-out' : ''}`}>
      {message}
    </div>
  );
};

export default Toast;
