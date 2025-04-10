// client/src/components/layout/PageTransition.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const PageTransition = ({ children }) => {
  const location = useLocation();
  
  return (
    <motion.div
      key={location.pathname}
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '-100%' }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      style={{ 
        width: '100%',
        position: 'relative', 
        height: 'auto',
        minHeight: '100%',
        overflow: 'visible'
      }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;