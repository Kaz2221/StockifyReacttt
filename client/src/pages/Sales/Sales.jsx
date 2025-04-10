// src/pages/Sales/Sales.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Sales.css";

function Sales() {
  const [sales, setSales] = useState([]);
  const [saleItems, setSaleItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSale, setSelectedSale] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    payment_method: "Credit Card",
    notes: "",
    user_id: 1,
    items: []
  });
  const [isEditing, setIsEditing] = useState(false);
  const [products, setProducts] = useState([]);

  const navigate = useNavigate();

  // Charger les ventes depuis le serveur
  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
      navigate("/");
      return;
    }

    fetchSales();
    fetchProducts();
  }, [navigate]);

  // Fonction pour récupérer les ventes
  const fetchSales = async () => {
    setLoading(true);
    try {
      const salesResponse = await fetch("http://localhost:5000/api/sales");
      const itemsResponse = await fetch("http://localhost:5000/api/sale_items");

      if (!salesResponse.ok || !itemsResponse.ok) {
        throw new Error("Erreur lors de la récupération des ventes");
      }

      const salesData = await salesResponse.json();
      const itemsData = await itemsResponse.json();
      
      setSales(salesData);
      setSaleItems(itemsData);
    } catch (err) {
      setError(err.message);
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour récupérer les produits
  const fetchProducts = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/items");
      
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des produits");
      }
      
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      console.error("Erreur lors du chargement des produits:", err);
    }
  };

  // Sélectionner une vente pour afficher ses détails
  const handleSelectSale = (sale) => {
    const saleId = Number(sale.id);
    setSelectedSale(saleId === selectedSale ? null : saleId);
  };

  // Gérer la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation des champs
    if (!formData.payment_method || formData.items.length === 0) {
      alert("Veuillez sélectionner une méthode de paiement et ajouter au moins un article");
      return;
    }

    try {
      // Calculer le montant total de la vente
      const total_amount = formData.items.reduce((sum, item) => {
        return sum + (parseFloat(item.unit_price) * parseInt(item.quantity));
      }, 0);

      const saleData = {
        payment_method: formData.payment_method,
        notes: formData.notes,
        user_id: formData.user_id,
        total_amount
      };

      if (isEditing) {
        // Mise à jour d'une vente existante
        const response = await fetch(
          `http://localhost:5000/api/sales/${formData.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(saleData),
          }
        );

        if (!response.ok) {
          throw new Error("Erreur lors de la mise à jour de la vente");
        }

        const updatedSale = await response.json();
        
        // Mettre à jour les articles de la vente
        await Promise.all(formData.items.map(async (item) => {
          if (item.id) {
            // Mettre à jour l'article existant
            await fetch(`http://localhost:5000/api/sale_items/${item.id}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                sale_id: updatedSale.id,
                item_id: item.item_id,
                quantity: item.quantity,
                unit_price: item.unit_price
              }),
            });
          } else {
            // Ajouter un nouvel article
            await fetch("http://localhost:5000/api/sale_items", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                sale_id: updatedSale.id,
                item_id: item.item_id,
                quantity: item.quantity,
                unit_price: item.unit_price,
                product_name: item.product_name
              }),
            });
          }
        }));

        // Supprimer les articles qui ont été retirés
        const currentItems = saleItems.filter(item => Number(item.sale_id) === Number(formData.id));
        const updatedItemIds = formData.items.filter(item => item.id).map(item => Number(item.id));
        
        await Promise.all(currentItems.map(async (item) => {
          if (!updatedItemIds.includes(Number(item.id))) {
            await fetch(`http://localhost:5000/api/sale_items/${item.id}`, {
              method: "DELETE",
            });
          }
        }));

        // Mettre à jour l'état local
        setSales(sales.map(sale => Number(sale.id) === Number(updatedSale.id) ? { ...sale, ...updatedSale } : sale));
        fetchSales(); // Recharger toutes les données pour mettre à jour les articles
      } else {
        // Ajout d'une nouvelle vente
        const response = await fetch("http://localhost:5000/api/sales", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(saleData),
        });

        if (!response.ok) {
          throw new Error("Erreur lors de l'ajout de la vente");
        }

        const newSale = await response.json();
        
        // Ajouter les articles de la vente
        await Promise.all(formData.items.map(async (item) => {
          await fetch("http://localhost:5000/api/sale_items", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              sale_id: newSale.id,
              item_id: item.item_id,
              quantity: item.quantity,
              unit_price: item.unit_price,
              product_name: item.product_name
            }),
          });
        }));

        // Mettre à jour l'état local
        setSales([...sales, newSale]);
        fetchSales(); // Recharger toutes les données
      }

      // Réinitialiser le formulaire
      resetForm();
    } catch (err) {
      console.error("Erreur lors de l'enregistrement de la vente:", err);
      alert("Une erreur est survenue lors de l'enregistrement de la vente");
    }
  };

  // Gérer les changements dans le formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Ajouter un article à la vente
  const handleAddItem = () => {
    if (products.length === 0) {
      alert("Aucun produit disponible");
      return;
    }
    
    const newItem = {
      item_id: products[0].id,
      product_name: products[0].product_name,
      quantity: 1,
      unit_price: products[0].price,
      subtotal: products[0].price
    };
    
    setFormData({
      ...formData,
      items: [...formData.items, newItem]
    });
  };

  // Mettre à jour un article de la vente
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    
    if (field === "item_id") {
      const selectedProduct = products.find(p => p.id === parseInt(value));
      updatedItems[index] = {
        ...updatedItems[index],
        item_id: parseInt(value),
        product_name: selectedProduct.product_name,
        unit_price: selectedProduct.price
      };
    } else {
      updatedItems[index][field] = value;
    }
    
    // Recalculer le sous-total
    updatedItems[index].subtotal = updatedItems[index].quantity * updatedItems[index].unit_price;
    
    setFormData({
      ...formData,
      items: updatedItems
    });
  };

  // Supprimer un article de la vente
  const handleRemoveItem = (index) => {
    const updatedItems = [...formData.items];
    updatedItems.splice(index, 1);
    
    setFormData({
      ...formData,
      items: updatedItems
    });
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      id: null,
      payment_method: "Credit Card",
      notes: "",
      user_id: 1,
      items: []
    });
    setIsEditing(false);
    setShowForm(false);
  };

  // Éditer une vente
  const handleEdit = (sale) => {
    const saleItemsList = saleItems
      .filter(item => Number(item.sale_id) === Number(sale.id))
      .map(item => ({
        id: item.id,
        item_id: item.item_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.quantity * item.unit_price
      }));
    
    setFormData({
      id: sale.id,
      payment_method: sale.payment_method,
      notes: sale.notes || "",
      user_id: sale.user_id,
      items: saleItemsList
    });
    
    setIsEditing(true);
    setShowForm(true);
  };

  // Supprimer une vente
  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette vente ?")) {
      try {
        const response = await fetch(
          `http://localhost:5000/api/sales/${id}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          throw new Error("Erreur lors de la suppression de la vente");
        }

        setSales(sales.filter((sale) => Number(sale.id) !== Number(id)));
        setSaleItems(saleItems.filter((item) => Number(item.sale_id) !== Number(id)));
      } catch (err) {
        console.error("Erreur lors de la suppression:", err);
        alert("Une erreur est survenue lors de la suppression de la vente");
      }
    }
  };

  // Formater la date pour l'affichage
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" };
    return new Date(dateString).toLocaleDateString("fr-FR", options);
  };

  // Formater le montant pour l'affichage en dollars
  const formatAmount = (amount) => {
    // S'assurer que amount est un nombre
    const numAmount = parseFloat(amount);
    
    // Vérifier si c'est un nombre valide
    if (isNaN(numAmount)) {
      return '$0.00';
    }
    
    return numAmount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
  };

  // Calculer le total des ventes
  const calculateTotalSales = () => {
    return sales.reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0);
  };

  // Obtenir les articles d'une vente spécifique
  const getSaleItems = (saleId) => {
    // Convertir les IDs en nombres pour garantir une comparaison cohérente
    return saleItems.filter(item => Number(item.sale_id) === Number(saleId));
  };

  if (loading) return <div className="loading">Chargement des ventes...</div>;
  if (error) return <div className="error-message">Erreur: {error}</div>;

  return (
    <div className="sales-page">
      <div className="sales-header">
        <h1>Gestion des ventes</h1>
        <button className="add-button" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Annuler" : "Nouvelle vente"}
        </button>
      </div>

      {showForm && (
        <div className="sales-form-container">
          <h2>{isEditing ? "Modifier la vente" : "Nouvelle vente"}</h2>
          <form onSubmit={handleSubmit} className="sales-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="payment_method">Méthode de paiement</label>
                <select
                  id="payment_method"
                  name="payment_method"
                  value={formData.payment_method}
                  onChange={handleChange}
                  required
                >
                  <option value="Credit Card">Carte de crédit</option>
                  <option value="Debit Card">Carte de débit</option>
                  <option value="Cash">Espèces</option>
                  <option value="Bank Transfer">Virement bancaire</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="notes">Notes</label>
                <input
                  type="text"
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="sale-items-section">
              <div className="sale-items-header">
                <h3>Articles</h3>
                <button 
                  type="button" 
                  className="add-item-button"
                  onClick={handleAddItem}
                >
                  Ajouter un article
                </button>
              </div>

              {formData.items.length === 0 ? (
                <div className="no-items">Aucun article ajouté</div>
              ) : (
                <table className="sale-items-table">
                  <thead>
                    <tr>
                      <th>Produit</th>
                      <th>Quantité</th>
                      <th>Prix unitaire</th>
                      <th>Sous-total</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <select
                            value={item.item_id}
                            onChange={(e) => handleItemChange(index, "item_id", e.target.value)}
                            required
                          >
                            {products.map(product => (
                              <option key={product.id} value={product.id}>
                                {product.product_name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, "quantity", parseInt(e.target.value))}
                            min="1"
                            required
                          />
                        </td>
                        <td>
                          {formatAmount(item.unit_price)}
                        </td>
                        <td>
                          {formatAmount(item.quantity * item.unit_price)}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="remove-item-button"
                            onClick={() => handleRemoveItem(index)}
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="3" className="total-label">Total</td>
                      <td colSpan="2" className="total-amount">
                        {formatAmount(
                          formData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>

            <div className="form-buttons">
              <button
                type="button"
                onClick={resetForm}
                className="cancel-button"
              >
                Annuler
              </button>
              <button type="submit" className="save-button">
                {isEditing ? "Mettre à jour" : "Enregistrer"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="sales-stats">
        <div className="stat-card">
          <h3>Total des ventes</h3>
          <p>{formatAmount(calculateTotalSales())}</p>
        </div>
        <div className="stat-card">
          <h3>Nombre de ventes</h3>
          <p>{sales.length}</p>
        </div>
        <div className="stat-card">
          <h3>Moyenne par vente</h3>
          <p>
            {formatAmount(
              sales.length
                ? calculateTotalSales() / sales.length
                : 0
            )}
          </p>
        </div>
      </div>

      <div className="sales-table-container">
        <table className="sales-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Méthode de paiement</th>
              <th>Montant</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sales.length === 0 ? (
              <tr>
                <td colSpan="5" className="no-data">
                  Aucune vente enregistrée
                </td>
              </tr>
            ) : (
              sales.map((sale) => (
                <React.Fragment key={sale.id}>
                  <tr
                    className={selectedSale === Number(sale.id) ? "selected-row" : ""}
                    onClick={() => handleSelectSale(sale)}
                  >
                    <td>{formatDate(sale.sale_date)}</td>
                    <td>{sale.payment_method}</td>
                    <td className="amount-cell">
                      {formatAmount(sale.total_amount)}
                    </td>
                    <td className="notes-cell">{sale.notes}</td>
                    <td className="actions-cell">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(sale);
                        }}
                        className="edit-button"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(sale.id);
                        }}
                        className="delete-button"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                  {selectedSale === Number(sale.id) && (
                    <tr className="sale-details-row">
                      <td colSpan="5">
                        <div className="sale-details">
                          <h4>Détails de la vente</h4>
                          <table className="sale-items-detail-table">
                            <thead>
                              <tr>
                                <th>Produit</th>
                                <th>Quantité</th>
                                <th>Prix unitaire</th>
                                <th>Sous-total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {getSaleItems(sale.id).length === 0 ? (
                                <tr>
                                  <td colSpan="4" className="no-data">
                                    Aucun article
                                  </td>
                                </tr>
                              ) : (
                                getSaleItems(sale.id).map((item) => (
                                  <tr key={item.id}>
                                    <td>{item.product_name}</td>
                                    <td>{item.quantity}</td>
                                    <td>{formatAmount(item.unit_price)}</td>
                                    <td>{formatAmount(item.quantity * item.unit_price)}</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Sales;