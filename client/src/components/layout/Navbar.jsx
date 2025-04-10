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
            <span className="user-email">{user.email}</span>
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