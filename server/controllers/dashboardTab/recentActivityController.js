import pool from '../../server.js';

export const getRecentActivity = async (req, res) => {
    const userId = req.user.id;
  
    const query = `
      SELECT 'Nouveau stock ajouté' AS type, created_at
      FROM items
      WHERE user_id = $1
  
      UNION ALL
  
      SELECT 'Nouvelle vente enregistrée' AS type, sale_date
      FROM sales
      WHERE user_id = $1
  
      UNION ALL
  
      SELECT 'Nouvelle dépense ajoutée' AS type, created_at
      FROM expenses
      WHERE user_id = $1
  
      ORDER BY created_at DESC
      LIMIT 5;
    `;
  
    try {
      const { rows } = await pool.query(query, [userId]);
      res.json(rows);
    } catch (err) {
      console.error("Erreur lors de la récupération des activités récentes:", err);
      res.status(500).json({ message: "Erreur serveur" });
    }
  };
  