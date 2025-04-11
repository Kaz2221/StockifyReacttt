// src/pages/Sales/Sales.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Sales.css";

function Sales() {
//  console.log("🔥 Sales component is rendering");
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
    items: []
  });
  const [isEditing, setIsEditing] = useState(false);
  const [products, setProducts] = useState([]);

  const navigate = useNavigate();

  // Charger les ventes depuis le serveur
  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchSales();
        await fetchSaleItems();  
        await fetchProducts();
      } catch (err) {
        if (err.message.includes("401")) {
          navigate("/"); // Redirect to login
        } else {
          console.error("Erreur lors du chargement des données:", err);
        }
      }
    };
  
    fetchData();
  }, [navigate]);
  
  

  // Fonction pour récupérer les ventes
  const fetchSales = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/sales/full", {
        credentials: "include"
      });
  
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des ventes");
      }
  
      const fullSales = await response.json();
  
      setSales(fullSales); // fullSales already includes .items[]
      setSaleItems([]); // ⛔ we no longer need this, but clear it for safety
      
    } catch (err) {
      setError(err.message);
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  };
  //{console.log("📦 sales in return:", sales)}


  // Fonction pour récupérer les produits
  const fetchProducts = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/items",{
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des produits");
      }
      
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      console.error("Erreur lors du chargement des produits:", err);
    }
  };

  const fetchSaleItems = async (saleId) => {
    try {
      console.log("🧾 Items being sent with sale:", formData.items);
      const response = await fetch("http://localhost:5000/api/sale_items", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
  
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des articles de vente");
      }
  
      const allItems = await response.json();
      console.log("✅ saleItemsidid fetched", allItems.saleId); // 🧪 Debug line
      console.log("✅ saleItems fetched:", allItems); // 🧪 Debug line

      const itemsForSale = allItems.filter(item => Number(item.sale_id) === Number(saleId));
  
      // Inject sale items into the form
      setFormData((prevData) => ({
        ...prevData,
        items: itemsForSale
      }));
    } catch (err) {
      console.error("Erreur lors du chargement des articles de la vente:", err);
    }
  };
  

  // Sélectionner une vente pour afficher ses détails
  const handleSelectSale = (sale) => {
    const saleId = Number(sale.sale_id);
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
        total_amount
      };
      if (isEditing) {
            // 🔄 1. Update the sale
          const updatedSale = await updateSale(formData.id, saleData);

          // ✏️ 2. Update or add sale items
          await updateSaleItems(updatedSale.sale_id, formData.items);

          // 🧹 3. Delete removed items
          await deleteRemovedItems(updatedSale.sale_id, formData.items, saleItems);

          // 🆙 4. Update state
          setSales(sales.map(sale => Number(sale.sale_id) === Number(updatedSale.sale_id) ? { ...sale, ...updatedSale } : sale));
          fetchSales();
      } else {
        // Ajout d'une nouvelle vente
        const response = await fetch("http://localhost:5000/api/sales", {
          method: "POST",
          credentials: "include", // 🔐 needed to send JWT cookie
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
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              
            },
            body: JSON.stringify({
              sale_id: newSale.sale_id,
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

  //-------------------------------------------START OF HELPER FUNCTIONS------------------------------------------
  // Mettre à jour une vente
  const updateSale = async (saleId, saleData) => {
    const response = await fetch(`http://localhost:5000/api/sales/${saleId}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(saleData)
    });
  
    if (!response.ok) throw new Error("Erreur lors de la mise à jour de la vente");
  
    return await response.json();
  };
    //METTRE A JOUR LES ITEMS DUNE VENTE
  const updateSaleItems = async (saleId, items) => {
    await Promise.all(items.map(async (item) => {
      const url = item.id
        ? `http://localhost:5000/api/sale_items/${item.id}`
        : "http://localhost:5000/api/sale_items";
  
      const method = item.id ? "PUT" : "POST";
  
      const body = item.id
        ? {
            item_id: item.item_id,
            quantity: item.quantity,
            unit_price: item.unit_price
          }
        : {
            sale_id: saleId,
            item_id: item.item_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            product_name: item.product_name
          };
  
      await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
    }));
  };
  //DELETE LES ITEMS DUNE VENTE
  const deleteRemovedItems = async (saleId, updatedItems, currentItems) => {
    const updatedItemIds = updatedItems.filter(i => i.id).map(i => Number(i.id));
  
    await Promise.all(currentItems
      .filter(item => Number(item.sale_id) === Number(saleId))
      .filter(item => !updatedItemIds.includes(Number(item.id)))
      .map(async (item) => {
        await fetch(`http://localhost:5000/api/sale_items/${item.id}`, {
          method: "DELETE",
          credentials: "include"
        });
      })
    );
  };
    //-------------------------------------------END OF HELPER FUNCTIONS------------------------------------------




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
        item_id: Number(value),
        product_name: selectedProduct?.product_name || "",
        unit_price: selectedProduct?.price || 0,
        quantity: updatedItems[index].quantity || 1, 
      };
    } else {
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value,
      };
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
      .filter(item => Number(item.sale_id) === Number(sale.id)) // <- changed here
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
        console.log("🧪 ID passed to delete sale fetch:", id);
        const response = await fetch(`http://localhost:5000/api/sales/${id}`, {
          method: "DELETE",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Erreur lors de la suppression de la vente");
        }

        setSales((prevSales) =>
          prevSales.filter((sale) => Number(sale.sale_id) !== Number(id))
        );        setSaleItems(saleItems.filter((item) => Number(item.sale_id) !== Number(id)));
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
    const sale = sales.find(s => s.id === saleId);
    return sale?.items || [];
  };

  if (loading) return <div className="loading">Chargement des ventes...</div>;
  if (error) return <div className="error-message">Erreur: {error}</div>;

  return (
    <div className="sales-page">
      <div className="sales-header">
        <h1>Gestion des ventes</h1>
        <button
              className="add-button"
              onClick={() => {
                if (showForm) {
                  // You're hiding the form = clicking "Annuler"
                  resetForm();
                  setIsEditing(false); // Optional if you're also handling editing mode
                }
                setShowForm(!showForm);
              }}
            >
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
  {console.log("🧪 Sales array at render:", sales)}

  {sales.length === 0 ? (
    <tr>
      <td colSpan="5" className="no-data">
        Aucune vente enregistrée
      </td>
    </tr>
  ) : (
    sales.map((sale) => {
      return (
        <React.Fragment key={sale.sale_id}>
          <tr
            className={selectedSale === Number(sale.sale_id) ? "selected-row" : ""}
            onClick={() => handleSelectSale(sale)}
          >
            <td>{formatDate(sale.sale_date)}</td>
            <td>{sale.payment_method}</td>
            <td className="amount-cell">{formatAmount(sale.total_amount)}</td>
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
                  handleDelete(sale.sale_id)
                }}
                className="delete-button"
              >
                Supprimer
              </button>
            </td>
          </tr>

          {selectedSale === Number(sale.sale_id) && (
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
      );
    })
  )}
</tbody>

        </table>
      </div>
    </div>
  );
}

export default Sales;