// src/components/layout/Navbar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  // Image par défaut si aucune photo de profil n'est fournie
  const defaultProfileImage = 'https://cdn.iconscout.com/icon/free/png-256/free-avatar-370-456322.png';

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/dashboard">Stockify</Link>
      </div>
      
      <div className="navbar-links">
        <Link to="/dashboard" className="nav-link">Tableau de bord</Link>
        <Link to="/inventory" className="nav-link">Inventaire</Link>
        <Link to="/sales" className="nav-link">Ventes</Link>
        <Link to="/expenses" className="nav-link">Dépenses</Link>
      </div>
      
      <div className="navbar-user">
        {user && (
          <>
            <div className="user-profile">
              <img 
                src={user.profile_picture || defaultProfileImage} 
                alt="Photo de profil" 
                className="profile-image"
              />
              <span className="user-name">
                {user.first_name} {user.last_name}
              </span>
            </div>
            <button onClick={handleLogout} className="logout-button">
              Déconnexion
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;