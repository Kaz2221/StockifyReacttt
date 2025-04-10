import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirmation", 
  message = "Êtes-vous sûr de vouloir supprimer cet élément ?",
  confirmText = "Supprimer",
  cancelText = "Annuler"
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <motion.div 
        className="confirmation-modal"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
      >
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="modal-actions">
          <button 
            onClick={onClose} 
            className="cancel-button"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm} 
            className="confirm-button"
          >
            {confirmText}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ConfirmationModal;