// Dans client/src/pages/Login/Login.jsx
import React, { useState } from 'react';
// Commentez cette ligne: import { useNavigate } from 'react-router-dom';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // Commentez cette ligne: const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Stocker les informations utilisateur dans localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Au lieu d'utiliser navigate, utilisez window.location
        window.location.href = '/dashboard';
      } else {
        setError(data.message || 'Identifiants incorrects');
      }
    } catch (err) {
      setError('Erreur lors de la connexion au serveur');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Stockify</h1>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="email"
              placeholder="Adresse e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="input-group">
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
        
        <div>
          <p>Pas encore de compte ? <span>Créer un compte</span></p>
          <span>Mot de passe oublié ?</span>
        </div>
      </div>
    </div>
  );
}

export default Login;