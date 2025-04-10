// client/src/components/layout/Footer.jsx
import React from 'react';
import './Footer.css';

function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>À propos</h3>
          <ul>
            <li><a href="#">Notre entreprise</a></li>
            <li><a href="#">Contact</a></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h3>Liens utiles</h3>
          <ul>
            <li><a href="#">Aide</a></li>
            <li><a href="#">Support</a></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h3>Légal</h3>
          <ul>
            <li><a href="#">Confidentialité</a></li>
            <li><a href="#">Conditions</a></li>
          </ul>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {currentYear} Stockify - Tous droits réservés</p>
      </div>
    </footer>
  );
}

export default Footer;