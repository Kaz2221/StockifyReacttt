import React from 'react';
import { motion } from 'framer-motion';


const DashboardCard = ({ title, children, buttonText, onClick, delay = 0 }) => {
  return (
    <motion.div
      className="dashboard-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <h2>{title}</h2>
      <div className="dashboard-card-content">{children}</div>
      {buttonText && (
        <motion.button
          className="action-btn"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClick}
        >
          {buttonText}
        </motion.button>
      )}
    </motion.div>
  );
};

export default DashboardCard;
