// src/pages/Dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Dashboard.css';

function Dashboard() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      navigate('/');
      return;
    }
    setUserData(user);
    setLoading(false);
  }, [navigate]);

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="dashboard-container">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Tableau de bord
      </motion.h1>

      <motion.div
        className="dashboard-grid"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {[0, 1, 2, 3].map((_, index) => (
          <motion.div
            key={index}
            className="dashboard-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
          >
            {index === 0 && (
              <>
                <h2>Inventaire</h2>
                <p>Nombre total d'articles : 124</p>
                <motion.button
                  className="action-btn"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Voir l'inventaire
                </motion.button>
              </>
            )}
            {index === 1 && (
              <>
                <h2>Ventes</h2>
                <p>Ventes du mois : 1,234 €</p>
                <motion.button
                  className="action-btn"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Voir les ventes
                </motion.button>
              </>
            )}
            {index === 2 && (
              <>
                <h2>Dépenses</h2>
                <p>Dépenses du mois : 567 €</p>
                <motion.button
                  className="action-btn"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Voir les dépenses
                </motion.button>
              </>
            )}
            {index === 3 && (
              <>
                <h2>Activités récentes</h2>
                <ul className="activity-list">
                  <li>Nouveau stock ajouté - Il y a 2 heures</li>
                  <li>Nouvelle vente enregistrée - Il y a 4 heures</li>
                  <li>Mise à jour de l'inventaire - Il y a 5 heures</li>
                </ul>
              </>
            )}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

export default Dashboard;
