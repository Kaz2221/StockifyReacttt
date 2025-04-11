// src/pages/Expenses/Expenses.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Expenses.css";

function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // État pour le formulaire d'ajout/modification
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    name: "",
    category: "",
    amount: "",
    expense_date: "",
    notes: "",
  });
  const [isEditing, setIsEditing] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchExpenses();
      } catch (err) {
        if (err.message.includes("401")) {
          navigate("/"); // Redirect if unauthorized
        } else {
          console.error("Erreur lors du chargement des dépenses:", err);
        }
      }
    };
  
    fetchData();
  }, [navigate]);
  
  // Fonction pour récupérer les dépenses
  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/expenses", {
        method: "GET",
        credentials: "include", // 👈 sends cookies (including your JWT)
      });
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des dépenses");
      }

      const data = await response.json();
      setExpenses(data);
    } catch (err) {
      setError(err.message);
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  };

  // Pour l'exemple, utilisons des données statiques si l'API n'est pas encore implémentée
  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
      navigate("/");
      return;
    }

    // Au lieu d'appeler fetchExpenses(), utilisez directement les données statiques
    setLoading(false);
    // Les données seront chargées par l'autre useEffect qui contient les données statiques
  }, [navigate]);

  // Gérer la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation des champs
    if (
      !formData.name ||
      !formData.category ||
      !formData.amount ||
      !formData.expense_date
    ) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      if (isEditing) {
        // Mise à jour d'une dépense existante
        const response = await fetch(
          `http://localhost:5000/api/expenses/${formData.id}`,
          {
            method: "PUT",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
          }
        );

        if (!response.ok) {
          throw new Error("Erreur lors de la mise à jour de la dépense");
        }

        const updatedExpense = await response.json();
        setExpenses(
          expenses.map((expense) =>
            expense.id === updatedExpense.id ? updatedExpense : expense
          )
        );
      } else {
        // Ajout d'une nouvelle dépense
        const response = await fetch("http://localhost:5000/api/expenses", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          throw new Error("Erreur lors de l'ajout de la dépense");
        }

        const newExpense = await response.json();
        setExpenses([...expenses, newExpense]);
      }

      // Réinitialiser le formulaire
      resetForm();
    } catch (err) {
      console.error("Erreur lors de l'enregistrement de la dépense:", err);
      alert("Une erreur est survenue lors de l'enregistrement de la dépense");
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
      name: "",
      category: "",
      amount: "",
      expense_date: "",
      notes: "",
    });
    setIsEditing(false);
    setShowForm(false);
  };

  // Éditer une dépense
  const handleEdit = (expense) => {
    setFormData({
      id: expense.id,
      name: expense.name,
      category: expense.category,
      amount: expense.amount,
      expense_date: expense.expense_date,
      notes: expense.notes || "",
    });
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette dépense ?")) {
      try {
        const response = await fetch(
          `http://localhost:5000/api/expenses/${id}`,
          {
            method: "DELETE",
            credentials: 'include',
          }
        );

        if (!response.ok) {
          throw new Error("Erreur lors de la suppression de la dépense");
        }

        setExpenses(expenses.filter((expense) => expense.id !== id));
      } catch (err) {
        console.error("Erreur lors de la suppression:", err);
        alert("Une erreur est survenue lors de la suppression de la dépense");
      }
    }
  };

  // Formater la date pour l'affichage
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
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

  if (loading) return <div className="loading">Chargement des dépenses...</div>;
  if (error) return <div className="error-message">Erreur: {error}</div>;

  return (
    <div className="expenses-page">
      <div className="expenses-header">
        <h1>Gestion des dépenses</h1>
        <button className="add-button" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Annuler" : "Ajouter une dépense"}
        </button>
      </div>

      {showForm && (
        <div className="expense-form-container">
          <h2>{isEditing ? "Modifier la dépense" : "Nouvelle dépense"}</h2>
          <form onSubmit={handleSubmit} className="expense-form">
            <div className="form-group">
              <label htmlFor="name">Intitulé</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">Catégorie</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">Sélectionner une catégorie</option>
                <option value="Locaux">Locaux</option>
                <option value="Charges">Charges</option>
                <option value="Services">Services</option>
                <option value="Matériel">Matériel</option>
                <option value="Salaires">Salaires</option>
                <option value="Marketing">Marketing</option>
                <option value="Autre">Autre</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="amount">Montant ($)</label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                step="0.01"
                min="0"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="expense_date">Date</label>
              <input
                type="date"
                id="expense_date"
                name="expense_date"
                value={formData.expense_date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
              ></textarea>
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

      <div className="expenses-stats">
        <div className="stat-card">
          <h3>Total des dépenses</h3>
          <p>
            {formatAmount(
              expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0)
            )}
          </p>
        </div>
        <div className="stat-card">
          <h3>Nombre de dépenses</h3>
          <p>{expenses.length}</p>
        </div>
        <div className="stat-card">
          <h3>Moyenne</h3>
          <p>
            {formatAmount(
              expenses.length
                ? expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0) /
                    expenses.length
                : 0
            )}
          </p>
        </div>
      </div>

      <div className="expenses-table-container">
        <table className="expenses-table">
          <thead>
            <tr>
              <th>Intitulé</th>
              <th>Catégorie</th>
              <th>Montant</th>
              <th>Date</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-data">
                  Aucune dépense enregistrée
                </td>
              </tr>
            ) : (
              expenses.map((expense) => (
                <tr key={expense.id}>
                  <td>{expense.name}</td>
                  <td>{expense.category}</td>
                  <td className="amount-cell">
                    {formatAmount(expense.amount)}
                  </td>
                  <td>{formatDate(expense.expense_date)}</td>
                  <td className="notes-cell">{expense.notes}</td>
                  <td className="actions-cell">
                    <button
                      onClick={() => handleEdit(expense)}
                      className="edit-button"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="delete-button"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Expenses;