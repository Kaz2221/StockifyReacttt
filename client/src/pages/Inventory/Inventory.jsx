// src/pages/Inventory/Inventory.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './Inventory.css';

function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');
  
  // État pour le formulaire d'ajout/modification
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    product_name: '',
    description: '',
    category: '',
    qty: 1,
    min_qty: 0,
    price: '',
    cost: '',
    purchase_date: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  
  const navigate = useNavigate();

  // Charger les articles depuis le serveur
  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!user) {
      navigate('/');
      return;
    }
    
    fetchInventory();
  }, [navigate]);

  // Fonction pour récupérer l'inventaire
  const fetchInventory = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/items');
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération de l\'inventaire');
      }
      
      const data = await response.json();
      setItems(data);
    } catch (err) {
      setError(err.message);
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les articles
  const filteredItems = items.filter(item => 
    item.product_name.toLowerCase().includes(filter.toLowerCase()) ||
    item.category.toLowerCase().includes(filter.toLowerCase())
  );

  // Gérer la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation des champs
    if (!formData.product_name || !formData.category || !formData.qty || !formData.price) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    try {
      if (isEditing) {
        // Mise à jour d'un article existant
        const response = await fetch(`http://localhost:5000/api/items/${formData.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        
        if (!response.ok) {
          throw new Error('Erreur lors de la mise à jour de l\'article');
        }
        
        const updatedItem = await response.json();
        setItems(items.map(item => item.id === updatedItem.id ? updatedItem : item));
      } else {
        // Ajout d'un nouvel article
        const response = await fetch('http://localhost:5000/api/items', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        
        if (!response.ok) {
          throw new Error('Erreur lors de l\'ajout de l\'article');
        }
        
        const newItem = await response.json();
        setItems([...items, newItem]);
      }
      
      // Réinitialiser le formulaire
      resetForm();
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement de l\'article:', err);
      alert('Une erreur est survenue lors de l\'enregistrement de l\'article');
    }
  };

  // Gérer les changements dans le formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      id: null,
      product_name: '',
      description: '',
      category: '',
      qty: 1,
      min_qty: 0,
      price: '',
      cost: '',
      purchase_date: ''
    });
    setIsEditing(false);
    setShowForm(false);
  };

  // Éditer un article
  const handleEdit = (item) => {
    setFormData({
      id: item.id,
      product_name: item.product_name,
      description: item.description || '',
      category: item.category,
      qty: item.qty,
      min_qty: item.min_qty,
      price: item.price,
      cost: item.cost || '',
      purchase_date: item.purchase_date || ''
    });
    setIsEditing(true);
    setShowForm(true);
  };

  // Supprimer un article
  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/items/${id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('Erreur lors de la suppression de l\'article');
        }
        
        setItems(items.filter(item => item.id !== id));
      } catch (err) {
        console.error('Erreur lors de la suppression:', err);
        alert('Une erreur est survenue lors de la suppression de l\'article');
      }
    }
  };

  // Formater la date pour l'affichage
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  // Formater le prix pour l'affichage
  const formatPrice = (price) => {
    return price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
  };

  if (loading) return <div className="loading">Chargement de l'inventaire...</div>;
  if (error) return <div className="error-message">Erreur: {error}</div>;

  return (
    <div className="inventory-page">
      <div className="inventory-header">
        <h1>Gestion de l'inventaire</h1>
        <motion.button 
          className="add-button" 
          onClick={() => setShowForm(!showForm)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {showForm ? 'Annuler' : 'Ajouter un article'}
        </motion.button>
      </div>
      
      <AnimatePresence>
        {showForm && (
          <motion.div 
            className="inventory-form-container"
            initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
            animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <h2>{isEditing ? 'Modifier l\'article' : 'Nouvel article'}</h2>
            <motion.form 
              onSubmit={handleSubmit} 
              className="inventory-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <motion.div 
                className="form-group full-width"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                <label htmlFor="product_name">Nom du produit</label>
                <input
                  type="text"
                  id="product_name"
                  name="product_name"
                  value={formData.product_name}
                  onChange={handleChange}
                  required
                />
              </motion.div>
              
              <motion.div 
                className="form-group full-width"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.3 }}
              >
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="2"
                ></textarea>
              </motion.div>
              
              <motion.div 
                className="form-group full-width"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <label htmlFor="category">Catégorie</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">Sélectionner une catégorie</option>
                  <option value="Electronics">Électronique</option>
                  <option value="Furniture">Mobilier</option>
                  <option value="Clothing">Vêtements</option>
                  <option value="Office Supplies">Fournitures de bureau</option>
                  <option value="Other">Autre</option>
                </select>
              </motion.div>
              
              <motion.div 
                className="form-group half-width"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.3 }}
              >
                <label htmlFor="qty">Quantité</label>
                <input
                  type="number"
                  id="qty"
                  name="qty"
                  value={formData.qty}
                  onChange={handleChange}
                  min="0"
                  required
                />
              </motion.div>
                
              <motion.div 
                className="form-group half-width"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <label htmlFor="min_qty">Quantité minimale</label>
                <input
                  type="number"
                  id="min_qty"
                  name="min_qty"
                  value={formData.min_qty}
                  onChange={handleChange}
                  min="0"
                />
              </motion.div>
              
              <motion.div 
                className="form-group half-width"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.3 }}
              >
                <label htmlFor="price">Prix de vente (€)</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  required
                />
              </motion.div>
                
              <motion.div 
                className="form-group half-width"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.3 }}
              >
                <label htmlFor="cost">Coût d'achat (€)</label>
                <input
                  type="number"
                  id="cost"
                  name="cost"
                  value={formData.cost}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                />
              </motion.div>
              
              <motion.div 
                className="form-group full-width"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.3 }}
              >
                <label htmlFor="purchase_date">Date d'achat</label>
                <input
                  type="date"
                  id="purchase_date"
                  name="purchase_date"
                  value={formData.purchase_date}
                  onChange={handleChange}
                />
              </motion.div>
              
              <motion.div 
                className="form-buttons full-width"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.3 }}
              >
                <button type="button" onClick={resetForm} className="cancel-button">
                  Annuler
                </button>
                <button type="submit" className="save-button">
                  {isEditing ? 'Mettre à jour' : 'Enregistrer'}
                </button>
              </motion.div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="inventory-stats">
        <motion.div 
          className="stat-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <h3>Articles en stock</h3>
          <p>{items.reduce((sum, item) => sum + item.qty, 0)}</p>
        </motion.div>
        <motion.div 
          className="stat-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <h3>Valeur totale</h3>
          <p>{formatPrice(items.reduce((sum, item) => sum + (item.price * item.qty), 0))}</p>
        </motion.div>
        <motion.div 
          className="stat-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <h3>Articles en alerte</h3>
          <p>{items.filter(item => item.qty <= item.min_qty).length}</p>
        </motion.div>
      </div>
      
      <motion.div 
        className="inventory-filter"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.3 }}
      >
        <input
          type="text"
          placeholder="Rechercher un article..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </motion.div>
      
      <motion.div 
        className="inventory-table-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Produit</th>
              <th>Catégorie</th>
              <th>Quantité</th>
              <th>Prix</th>
              <th>Valeur</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-data">Aucun article trouvé</td>
              </tr>
            ) : (
              filteredItems.map((item, index) => (
                <motion.tr 
                  key={item.id} 
                  className={item.qty <= item.min_qty ? 'low-stock' : ''}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + (index * 0.05), duration: 0.3 }}
                >
                  <td>
                    <div className="product-info">
                      <div className="product-name">{item.product_name}</div>
                      {item.description && <div className="product-description">{item.description}</div>}
                    </div>
                  </td>
                  <td>{item.category}</td>
                  <td className="quantity-cell">
                    <span className={item.qty <= item.min_qty ? 'warning' : ''}>{item.qty}</span>
                    {item.qty <= item.min_qty && <span className="stock-alert">Alerte stock</span>}
                  </td>
                  <td className="price-cell">{formatPrice(item.price)}</td>
                  <td className="value-cell">{formatPrice(item.price * item.qty)}</td>
                  <td className="actions-cell">
                    <motion.button 
                      onClick={() => handleEdit(item)} 
                      className="edit-button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Modifier
                    </motion.button>
                    <motion.button 
                      onClick={() => handleDelete(item.id)} 
                      className="delete-button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Supprimer
                    </motion.button>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}

export default Inventory;